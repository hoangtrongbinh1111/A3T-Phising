const fs = require('fs')
const path = require('path')
const mergeFiles = require('merge-files');
const ffmpeg = require('fluent-ffmpeg');


exports.getExtentionFile = ({ fileName }) => {
    const regexAll = /[^\\]*\.(\w+)$/;
    const total = fileName.match(regexAll);
    return total[1];
}

exports.getDir = ({ dir }) => {

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
}

exports.removeDir = ({ dir }) => {
    fs.rmSync(dir, { recursive: true, force: true });
}


exports.concatenateFile = async ({ listFile, destination }) => {
    return await mergeFiles(listFile, destination);
}

exports.compressVideo = ({ videoPath, destinationFileName }) => {
    try {
        ffmpeg(videoPath)
            .videoCodec('libx264')
            .audioCodec('libmp3lame')
            .size('1280x720')
            .autopad(true, 'white')
            .keepDAR()
            .videoBitrate(4000)
            .fps(29.7)
            .on('start', function (commandLine) {
                console.log('Spawned Ffmpeg with command: ' + commandLine);
            })
            .on('progress', function (progress) {
                console.log('Processing: ' + progress.percent + '% done');
            })
            .on('error', function (err, stdout, stderr) {
                console.log('Cannot process video: ' + err.message);
            })
            .on('end', function (stdout, stderr) {
                fs.rmSync(videoPath, { recursive: true });
                fs.renameSync(destinationFileName, videoPath);
                console.log('Transcoding succeeded !');
            })
            .save(destinationFileName);
    } catch (e) {
        console.error(e);
    }
}