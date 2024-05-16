from flask import Flask, render_template, request, redirect, url_for, jsonify
import os
import subprocess
import signal
import json
from werkzeug.utils import secure_filename
import uuid
import pandas as pd
from datetime import datetime, timedelta

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['STATS_FOLDER'] = 'static/stats'
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif'}

def load_channels():
    if not os.path.exists('config.json'):
        return []
    with open('config.json') as f:
        return json.load(f)

def save_channels(channels):
    with open('config.json', 'w') as f:
        json.dump(channels, f, indent=4)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

def build_command(channel):
    required_keys = [
        'input_protocol', 'input_ip', 'input_port', 'input_rcvbuf', 'input_sndbuf', 'input_latency',
        'output_protocol', 'output_port', 'output_rcvbuf', 'output_sndbuf', 'output_latency',
        'mode', 'oheadbw', 'maxbw'
    ]

    for key in required_keys:
        if key not in channel:
            raise KeyError(f"Missing required key: {key}")

    input_protocol = channel['input_protocol']
    input_ip = channel['input_ip']
    input_port = channel['input_port']
    input_rcvbuf = channel['input_rcvbuf']
    input_sndbuf = channel['input_sndbuf']
    input_latency = channel['input_latency']

    output_protocol = channel['output_protocol']
    output_port = channel['output_port']
    output_rcvbuf = channel['output_rcvbuf']
    output_sndbuf = channel['output_sndbuf']
    output_latency = channel['output_latency']
    mode = channel['mode']
    oheadbw = channel['oheadbw']
    maxbw = channel['maxbw']
    destination_host = channel.get('destination_host', '')
    passphrase = channel.get('passphrase', '')

    input_url = f"{input_protocol}://{input_ip}:{input_port}?rcvbuf={input_rcvbuf}"

    if mode == 'listener':
        output_url = f"srt://:{output_port}?mode={mode}&latency={input_latency}&oheadbw={oheadbw}&maxbw={maxbw}&sndbuf={output_sndbuf}&rcvbuf={output_rcvbuf}"
    else:
        output_url = f"srt://{destination_host}:{output_port}?mode={mode}&latency={input_latency}&oheadbw={oheadbw}&maxbw={maxbw}&sndbuf={output_sndbuf}&rcvbuf={output_rcvbuf}"

    if passphrase:
        output_url += f"&passphrase={passphrase}"

    sanitized_channel_name = channel['channel_name'].replace(' ', '_')
    stats_file = os.path.join(app.config['STATS_FOLDER'], f"{sanitized_channel_name}.csv")
    cmd = f'srt-live-transmit "{input_url}" "{output_url}" -s 5000 -stats-report-frequency:5000 -statspf:csv -statsout:{stats_file}'

    return cmd, stats_file

@app.route('/', methods=['GET', 'POST'])
def index():
    channels = load_channels()
    return render_template('index.html', channels=channels)

@app.route('/start/<channel_name>', methods=['POST'])
def start_channel(channel_name):
    channels = load_channels()
    for channel in channels:
        if channel['channel_name'] == channel_name:
            cmd, stats_file = build_command(channel)
            print(f"Executing command: {cmd}")  # Debug output
            process = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            channel['pid'] = process.pid
            channel['status'] = 'running'
            channel['stats_file'] = stats_file
            channel['start_date'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
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
        channel['start_date'] = 'N/A'

        if 'destination_host' not in channel:
            channel['destination_host'] = ''

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

                if 'destination_host' not in channel:
                    channel['destination_host'] = ''

                if 'logo' in request.files:
                    logo = request.files['logo']
                    if logo.filename != '':
                        filename = str(uuid.uuid4()) + '.png'
                        logo.save(os.path.join('static/uploads', filename))
                        channel['logo'] = filename

                save_channels(channels)
                return redirect(url_for('index'))
            else:
                return jsonify(channel)
    return 'Channel not found', 404

@app.route('/delete/<channel_name>', methods=['POST'])
def delete_channel(channel_name):
    channels = load_channels()
    channels = [channel for channel in channels if channel['channel_name'] != channel_name]
    save_channels(channels)
    return redirect(url_for('index'))

@app.route('/stats/<channel_name>', methods=['GET'])
def view_stats(channel_name):
    channels = load_channels()
    for channel in channels:
        if channel['channel_name'] == channel_name:
            stats_file = channel.get('stats_file', '')
            if stats_file and os.path.exists(stats_file):
                data = pd.read_csv(stats_file)
                return render_template('stats.html', channel_name=channel_name, data=data.to_dict(orient='records'))
    return 'Stats not found', 404

@app.route('/stats_data/<channel_name>', methods=['GET'])
def stats_data(channel_name):
    channels = load_channels()
    for channel in channels:
        if channel['channel_name'] == channel_name:
            stats_file = channel.get('stats_file', '')
            if stats_file and os.path.exists(stats_file):
                data = pd.read_csv(stats_file)
                time_range = request.args.get('timeRange', 'all')
                if time_range != 'all':
                    time_range = int(time_range)
                    end_time = data['Time'].max()
                    end_datetime = datetime.strptime(end_time, '%Y-%m-%dT%H:%M:%S.%f%z')
                    start_datetime = end_datetime - timedelta(minutes=time_range)
                    data = data[pd.to_datetime(data['Time']) >= start_datetime]
                return jsonify(data.to_dict(orient='records'))
    return jsonify([])

if __name__ == '__main__':
    os.makedirs(app.config['STATS_FOLDER'], exist_ok=True)
    app.run(host='0.0.0.0', port=3200, debug=True)
