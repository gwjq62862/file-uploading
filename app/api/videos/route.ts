

import { NextResponse } from "next/server";

export async function GET() {
  const videos = [
    {
      id: "1",
      title: "Sample Video",
      url: "https://khali-uploading-file-pratice.t3.tigrisfiles.io/f0ef84b6-7389-4894-b431-47adf662c7ab-4214779-uhd_3840_2160_25fps.mp4"
    }
  ];

  return NextResponse.json(videos);
}