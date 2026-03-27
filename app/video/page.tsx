"use client";

import React, { useEffect, useState } from "react";

type VideoItem = {
  id: string;
  title: string;
  url: string;
};

const VideoPage = () => {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const res = await fetch("/api/videos");

        if (!res.ok) {
          throw new Error("Failed to fetch videos");
        }

        const data = await res.json();

        setVideos(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  if (loading) {
    return <div>Loading videos...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
      {videos.map((video) => (
        <div key={video.id} className="space-y-2">
          <video
            src={video.url}
            controls
            className="w-full rounded-xl"
            preload="metadata"
          />

          <p className="text-sm font-medium">
            {video.title}
          </p>
        </div>
      ))}
    </div>
  );
};

export default VideoPage;