import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types"; // Импорт prop-types
import WaveSurfer from "wavesurfer.js";
import { PlayCircleFilled, PauseCircleFilled } from "@ant-design/icons";
import "./VoiceMessagePlayer.css";

const VoiceMessagePlayer = ({ audioUrl }) => {
    const waveformRef = useRef(null);
    const wavesurfer = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);

    useEffect(() => {
        if (!waveformRef.current) return;

        wavesurfer.current = WaveSurfer.create({
            container: waveformRef.current,
            waveColor: "#d1d5db",
            progressColor: "#3b82f6",
            cursorColor: "transparent",
            height: 40,
            responsive: true,
            normalize: true,
            barWidth: 2,
            barGap: 1,
        });

        wavesurfer.current.load(audioUrl);

        wavesurfer.current.on("ready", () => {
            setDuration(wavesurfer.current.getDuration());
        });

        wavesurfer.current.on("audioprocess", (time) => {
            setCurrentTime(time);
        });

        return () => {
            if (wavesurfer.current) {
                try {
                    wavesurfer.current.destroy();
                } catch (error) {
                    // Если ошибка AbortError – игнорируем её, иначе выводим в консоль
                    if (error.name !== "AbortError") {
                        console.error("Error destroying wavesurfer:", error);
                    }
                }
            }
        };
    }, [audioUrl]);

    const togglePlayPause = () => {
        if (wavesurfer.current) {
            wavesurfer.current.playPause();
            setIsPlaying(!isPlaying);
        }
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
    };

    return (
        <div className="voice-message-container">
            <button className="play-button" onClick={togglePlayPause}>
                {isPlaying ? (
                    <PauseCircleFilled style={{ fontSize: 24, color: "#3b82f6" }} />
                ) : (
                    <PlayCircleFilled style={{ fontSize: 24, color: "#3b82f6" }} />
                )}
            </button>

            <div className="waveform-container" ref={waveformRef} />

            <div className="time-container">
                <span className="time-text">
                    {formatTime(currentTime)} / {formatTime(duration)}
                </span>
            </div>
        </div>
    );
};

VoiceMessagePlayer.propTypes = {
    audioUrl: PropTypes.string.isRequired, // Валидация для audioUrl
};

export default VoiceMessagePlayer;
