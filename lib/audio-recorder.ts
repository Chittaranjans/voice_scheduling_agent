export interface AudioSlice {
  index: number
  data: Blob
  timestamp: number
  duration: number
}

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null
  private audioChunks: Blob[] = []
  private stream: MediaStream | null = null
  private recordingStartTime: number = 0

  async startRecording(): Promise<MediaStream> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Audio recording is not supported in this browser")
    }

    this.stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44100,
      } 
    })
    
    // Determine the best supported format
    let mimeType = "audio/webm;codecs=opus"
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = "audio/webm"
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "audio/mp4"
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = "" // Let the browser choose
        }
      }
    }
    
    this.mediaRecorder = new MediaRecorder(this.stream, { 
      mimeType: mimeType || undefined 
    })
    this.audioChunks = []
    this.recordingStartTime = Date.now()

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data)
      }
    }

    this.mediaRecorder.start(100) // Collect data every 100ms for smooth waveform

    return this.stream
  }

  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error("No recording in progress"))
        return
      }

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder?.mimeType || "audio/webm"
        const audioBlob = new Blob(this.audioChunks, { type: mimeType })
        this.cleanup()
        resolve(audioBlob)
      }

      this.mediaRecorder.onerror = (event) => {
        this.cleanup()
        reject(new Error("Recording error occurred"))
      }

      this.mediaRecorder.stop()
    })
  }

  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop())
      this.stream = null
    }
    this.mediaRecorder = null
    this.audioChunks = []
  }

  isRecording(): boolean {
    return this.mediaRecorder !== null && this.mediaRecorder.state === "recording"
  }

  getRecordingTime(): number {
    if (!this.recordingStartTime) return 0
    return Date.now() - this.recordingStartTime
  }

  getStream(): MediaStream | null {
    return this.stream
  }
}
