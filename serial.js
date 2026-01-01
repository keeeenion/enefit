const connectButton = document.getElementById("connect");
connectButton.addEventListener('click', connectSerial);

async function connectSerial() {
    if (!('serial' in navigator)) {
        alert('Web Serial API not supported');
        return;
    }

    const port = await getSerialPort();
    await openSerialPort(port);

    connectButton.remove()

    const onSerialData = createTwoNumberParser(([solar, battery]) => {
        solar_slider_change(solar);

        const battery_ratio_convert = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5]
        const battery_ratio = battery_ratio_convert[battery];
        battery_slider_change(battery_ratio);
    });

    listenToSerial(port, chunk => {
        onSerialData(chunk);
    });
}

function createTwoNumberParser(onMessage) {
    let buffer = '';

    return function onChunk(chunk) {
        buffer += chunk;

        const regex = /\[\s*-?\d+\s*,\s*-?\d+\s*\]/g;
        let lastIndex = 0;
        let match;

        while ((match = regex.exec(buffer)) !== null) {
            onMessage(JSON.parse(match[0]));
            lastIndex = regex.lastIndex;
        }

        // Remove everything up to the last emitted message
        if (lastIndex > 0) {
            buffer = buffer.slice(lastIndex);
        }

        // Safety guard against corrupted streams
        if (buffer.length > 1024) {
            buffer = '';
        }
    };
}


async function getSerialPort() {
    // Get previously paired ports
    const ports = await navigator.serial.getPorts();

    if (ports.length > 0) {
        return ports[0];
    }

    // Ask user to select a port
    return await navigator.serial.requestPort();
}

async function openSerialPort(port) {
    if (!port.readable) {
        await port.open({
            baudRate: 9600, // change if needed
        });
    }
}

async function listenToSerial(port, onData) {
    const decoder = new TextDecoder();

    while (port.readable) {
        const reader = port.readable.getReader();

        try {
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                onData(decoder.decode(value));
            }
        } catch (error) {
            console.error('Serial read error:', error);
        } finally {
            reader.releaseLock();
        }
    }
}

