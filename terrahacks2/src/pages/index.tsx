import VideoAnalyzer from "@/components/VideoAnalyzer";
import Head from "next/head";

export default function Home() {
  return (
    <>
      <Head>
        <title>AI Exercise Analyzer - Smart Fitness Form Analysis</title>
        <meta name="description" content="Upload any exercise video and get instant AI-powered form analysis and feedback using Google Gemini" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main style={{
        margin: 0,
        padding: 0,
        minHeight: '100vh',
        backgroundColor: '#f7fafc'
      }}>
        <VideoAnalyzer />
      </main>
    </>
  );
}
