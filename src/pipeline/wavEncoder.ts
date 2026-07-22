/**
 * 아주 단순한 모노 16bit PCM WAV 인코더. 외부 오디오 라이브러리 없이, Mock Provider들이
 * 절차적으로 만든 사인파 샘플을 실제로 재생 가능한 WAV 파일(및 data URI)로 바꾸는 데만 쓴다.
 */

export function encodeWav(samples: Float32Array, sampleRate: number): Buffer {
  const bytesPerSample = 2;
  const dataSize = samples.length * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0, "ascii");
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8, "ascii");
  buffer.write("fmt ", 12, "ascii");
  buffer.writeUInt32LE(16, 16); // PCM 청크 크기
  buffer.writeUInt16LE(1, 20); // audio format = PCM
  buffer.writeUInt16LE(1, 22); // channels = mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * bytesPerSample, 28); // byte rate
  buffer.writeUInt16LE(bytesPerSample, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits per sample
  buffer.write("data", 36, "ascii");
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < samples.length; i += 1) {
    const clamped = Math.max(-1, Math.min(1, samples[i] ?? 0));
    buffer.writeInt16LE(Math.round(clamped * 32767), 44 + i * 2);
  }

  return buffer;
}

export function toWavDataUri(samples: Float32Array, sampleRate: number): string {
  const wav = encodeWav(samples, sampleRate);
  return `data:audio/wav;base64,${wav.toString("base64")}`;
}

/** duration 길이의 무음(0) 샘플 배열을 만든다. */
export function silence(durationSeconds: number, sampleRate: number): Float32Array {
  return new Float32Array(Math.max(0, Math.round(durationSeconds * sampleRate)));
}

/**
 * 부드러운 페이드 인/아웃이 적용된 사인파를 만든다. amplitudeEnvelope가 주어지면
 * 각 샘플의 진폭에 추가로 곱해진다(트레몰로 등 표현에 사용).
 */
export function sineTone(
  durationSeconds: number,
  frequencyHz: number,
  sampleRate: number,
  amplitude: number,
  amplitudeEnvelope?: (t: number) => number,
): Float32Array {
  const numSamples = Math.max(1, Math.round(durationSeconds * sampleRate));
  const samples = new Float32Array(numSamples);
  const fadeSamples = Math.min(numSamples, Math.round(sampleRate * 0.03));

  for (let i = 0; i < numSamples; i += 1) {
    const t = i / sampleRate;
    let fade = 1;
    if (i < fadeSamples) {
      fade = i / fadeSamples;
    } else if (i > numSamples - fadeSamples) {
      fade = (numSamples - i) / fadeSamples;
    }
    const envelope = amplitudeEnvelope ? amplitudeEnvelope(t) : 1;
    samples[i] = Math.sin(2 * Math.PI * frequencyHz * t) * amplitude * fade * envelope;
  }

  return samples;
}

/** 여러 샘플 배열을 같은 길이로 맞춰 합산한다(화음/배경음악 합성용). 넘치는 값은 -1~1로 clamp된다. */
export function mixSamples(tracks: Float32Array[]): Float32Array {
  const length = Math.max(0, ...tracks.map((track) => track.length));
  const mixed = new Float32Array(length);
  for (const track of tracks) {
    for (let i = 0; i < track.length; i += 1) {
      mixed[i] = (mixed[i] ?? 0) + (track[i] ?? 0);
    }
  }
  return mixed;
}
