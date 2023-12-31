from flask import Flask, render_template, request, redirect, url_for
import os
import subprocess
import signal
import json
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif'}


def load_channels():
    with open('config.json') as f:
        return json.load(f)

def save_channels(channels):
    with open('config.json', 'w') as f:
        json.dump(channels, f, indent=4)

def build_command(channel):
    input_protocol = channel['input_protocol']
    input_ip = channel['input_ip']
    input_port = channel['input_port']
    input_rcvbuf = channel['input_rcvbuf']
    input_sndbuf = channel['input_sndbuf']
    input_latency = channel['input_latency']

    output_protocol = channel['output_protocol']
    output_ip = channel['output_ip']
    output_port = channel['output_port']
    output_rcvbuf = channel['output_rcvbuf']
    output_sndbuf = channel['output_sndbuf']
    output_latency = channel['output_latency']


    input_url = f"{input_protocol}://{input_ip}:{input_port}" \
                f"?rcvbuf={input_rcvbuf}&sndbuf={input_sndbuf}&latency={input_latency}"

    if output_protocol == 'srt':
        output_url = f"srt://:{output_port}" \
                     f"?rcvbuf={output_rcvbuf}&sndbuf={output_sndbuf}&latency={output_latency}"
    else:
        output_url = f"{output_protocol}://{output_ip}:{output_port}" \
                     f"?rcvbuf={output_rcvbuf}&sndbuf={output_sndbuf}&latency={output_latency}"

    cmd = f"srt-live-transmit {input_url} {output_url}"

    return cmd

@app.route('/', methods=['GET', 'POST'])
def index():
    channels = load_channels()
    return render_template('index.html', channels=channels)

@app.route('/start/<channel_name>', methods=['POST'])
def start_channel(channel_name):
    channels = load_channels()
    for channel in channels:
        if channel['channel_name'] == channel_name:
            cmd = build_command(channel)
            process = subprocess.Popen(cmd.split(), stdout=subprocess.PIPE)
            channel['pid'] = process.pid
            channel['status'] = 'running'
            save_channels(channels)
            return redirect(url_for('index'))
    return 'Channel not found', 404

@app.route('/stop/<channel_name>', methods=['POST'])
def stop_channel(channel_name):
    channels = load_channels()
    for channel in channels:
        if channel['channel_name'] == channel_name:
            if 'pid' in channel:
                try:
                    os.kill(channel['pid'], signal.SIGTERM)
                except ProcessLookupError:
                    # Process already terminated, ignore error
                    pass
                del channel['pid']
                channel['status'] = 'stopped'
                save_channels(channels)
            return redirect(url_for('index'))
    return 'Channel not found', 404

@app.route('/new', methods=['GET', 'POST'])
def new_channel():
    if request.method == 'POST':
        channel = request.form.to_dict()
        channel['status'] = 'stopped'

        # Handle logo upload
        if 'logo' in request.files:
            file = request.files['logo']
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                channel['logo'] = filename

        channels = load_channels()
        channels.append(channel)
        save_channels(channels)
        return redirect(url_for('index'))
    return render_template('new.html')

@app.route('/edit/<channel_name>', methods=['GET', 'POST'])
def edit_channel(channel_name):
    channels = load_channels()
    for channel in channels:
        if channel['channel_name'] == channel_name:
            if request.method == 'POST':
                for key, value in request.form.items():
                    channel[key] = value

                # Handle file upload for logo
                if 'logo' in request.files:
                    logo = request.files['logo']
                    if logo.filename != '':
                        filename = str(uuid.uuid4()) + '.png'  # Generate a unique filename
                        logo.save(os.path.join('static/uploads', filename))
                        channel['logo'] = filename

                save_channels(channels)
                return redirect(url_for('index'))
            else:
                return render_template('edit.html', channel=channel)
    return 'Channel not found', 404

@app.route('/delete/<channel_name>', methods=['POST'])
def delete_channel(channel_name):
    channels = load_channels()
    channels = [channel for channel in channels if channel['channel_name'] != channel_name]
    save_channels(channels)
    return redirect(url_for('index'))

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3200, debug=True)

