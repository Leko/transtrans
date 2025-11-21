export default function Onboarding() {
  return (
    <div>
      <h2 className="text-center">
        <span className="text-xl font-bold">TransTrans</span> - Live
        Transcription and Translation
      </h2>

      <h3 className="text-lg font-bold mt-4">How to start:</h3>
      <ol className="list-decimal list-inside">
        <li>Choose Source Language</li>
        <li>Choose Target Language</li>
        <li>Choose Audio Source</li>
        <li>Click the start button</li>
      </ol>

      <h3 className="text-lg font-bold mt-4">Disclaimer:</h3>
      <ul className="list-decimal list-inside">
        <li>Audio with multiple speakers may not be accurately analyzed.</li>
        <li>
          Audio contains multiple languages may not be analyzed accurately.
        </li>
        <li>
          We do not collect your audio data; however, it may communicate with a
          server for audio analysis (i.e. Google&apos;s). Please exercise
          caution when using it with confidential or sensitive audio content.
        </li>
      </ul>

      <h3 className="text-lg font-bold mt-4">How it works:</h3>
      <p>
        TransTrans uses the Web Speech Recognition API to transcribe your speech
        in real-time. It then uses the Translation API to translate the
        transcription into the target language.
      </p>
      <h2>
        <span className="text-xl font-bold">TransTrans</span> - Live
        Transcription and Translation
      </h2>

      <h3 className="text-lg font-bold mt-4">How to start:</h3>
      <ol className="list-decimal list-inside">
        <li>Choose Source Language</li>
        <li>Choose Target Language</li>
        <li>Choose Audio Source</li>
        <li>Click the start button</li>
      </ol>
    </div>
  );
}
