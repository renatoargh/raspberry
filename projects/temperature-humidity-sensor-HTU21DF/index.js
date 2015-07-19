// To be ran with `sudo`

var async = require('async'),
    i2c = require('i2c'),
    wire = new i2c('0x40', {
        device: '/dev/i2c-1'
    });

function reset(cb) {
    wire.writeByte(0xFE, function(err) {
        if(err) {
            throw err;
        }

        setTimeout(cb, 20);
    });
}

function checkInitialization(cb) {
    wire.writeByte(0xE7, function(err) {
        if(err) {
            throw err;
        }

        wire.readByte(function(err, result) {
            if(err) {
                throw err;
            }

            if(parseInt(result, 16) !== 2) {
                throw new Error('Failed to initialize');
            }

            cb();
        });
    });
}

function readTemperature(cb) {
    wire.writeByte(0xE3, function(err) {
        if(err) {
            throw err;
        }

        setTimeout(function() {
            wire.read(3, function(err, result) {
                if(err) {
                    throw err;
                }

                result = (result[0] << 8) + result[1];
                result *= 175.72;
                result /= 65536;
                result -= 46.85;

                cb(null, result);
            });
        }, 60);
    });
}

function readHumidity(cb) {
    wire.writeByte(0xE5, function(err) {
        if(err) {
            throw err;
        }

        setTimeout(function() {
            wire.read(3, function(err, result) {
                if(err) {
                    throw err;
                }

                result = (result[0] << 8) + result[1];
                result *= 125;
                result /= 65536;
                result -= 6;

                cb(null, result);
            });
        }, 60);
    });
}

async.series([
    reset,
    checkInitialization,
    readTemperature,
    readHumidity
], function(err, results) {
    if(err) {
        throw err;
    }

    var line = [
        new Date().valueOf(),
        results[2],
        results[3]
    ].join(';') + '\n';

    process.stdout.write(line);
});
