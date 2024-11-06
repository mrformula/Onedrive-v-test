import { useEffect, useRef, useState } from 'react'
import Plyr from 'plyr-react'
import "plyr-react/plyr.css"

export default function Home() {
    const [audioTrack, setAudioTrack] = useState(1)
    const playerRef = useRef(null)

    // আপনার Google Drive ভিডিও লিংক এখানে বসান
    const videoUrl = "YOUR_GOOGLE_DRIVE_DIRECT_LINK"

    const plyrOptions = {
        controls: [
            'play-large',
            'play',
            'progress',
            'current-time',
            'duration',
            'mute',
            'volume',
            'settings',
            'fullscreen'
        ],
        settings: ['quality', 'speed'],
    }

    const handleAudioChange = (trackNumber) => {
        const player = playerRef.current?.plyr
        if (player) {
            // অডিও ট্র্যাক পরিবর্তন
            player.currentTime = player.currentTime
            setAudioTrack(trackNumber)
        }
    }

    return (
        <div className="container mx-auto p-4">
            <div className="max-w-3xl mx-auto">
                <Plyr
                    ref={playerRef}
                    source={{
                        type: 'video',
                        sources: [{ src: videoUrl }],
                    }}
                    options={plyrOptions}
                />

                <div className="mt-4 flex gap-4">
                    <button
                        onClick={() => handleAudioChange(1)}
                        className={`px-4 py-2 rounded ${audioTrack === 1 ? 'bg-blue-500 text-white' : 'bg-gray-200'
                            }`}
                    >
                        অডিও ট্র্যাক 1
                    </button>
                    <button
                        onClick={() => handleAudioChange(2)}
                        className={`px-4 py-2 rounded ${audioTrack === 2 ? 'bg-blue-500 text-white' : 'bg-gray-200'
                            }`}
                    >
                        অডিও ট্র্যাক 2
                    </button>
                </div>
            </div>
        </div>
    )
} 