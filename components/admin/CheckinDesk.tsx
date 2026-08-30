'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import jsQR from 'jsqr';
import { checkIn, giveKit, lookupDelegate, type ActionResult } from '@/lib/actions/admin';
import { formatDateTime, STATUS_LABEL } from '@/lib/format';

type Delegate = Awaited<ReturnType<typeof lookupDelegate>>;

/**
 * On-site check-in.
 *
 * Camera-first because the queue is the constraint: the scanner reads the
 * delegate's QR, the desk confirms the name against the face, and one tap
 * records it. Manual entry is always available — badges get lost, cameras get
 * denied, and the queue still has to move.
 */
export function CheckinDesk() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastScan = useRef<{ ref: string; at: number }>({ ref: '', at: 0 });

  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manual, setManual] = useState('');
  const [delegate, setDelegate] = useState<Delegate>(null);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  };

  useEffect(() => stopCamera, []);

  async function startCamera() {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanning(true);
    } catch {
      setCameraError(
        'No camera access. Allow the camera for this site, or type the reference by hand.'
      );
    }
  }

  // Poll frames while the camera is live, decoding at a rate the queue can use
  // without pinning the CPU of whatever laptop is on the desk.
  useEffect(() => {
    if (!scanning) return;

    const timer = window.setInterval(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(image.data, image.width, image.height, { inversionAttempts: 'dontInvert' });

      if (!code?.data) return;

      // Ignore the same badge held in front of the lens for several seconds.
      const now = Date.now();
      if (lastScan.current.ref === code.data && now - lastScan.current.at < 4000) return;
      lastScan.current = { ref: code.data, at: now };

      load(code.data);
    }, 350);

    return () => window.clearInterval(timer);
  }, [scanning]);

  function load(ref: string) {
    startTransition(async () => {
      const found = await lookupDelegate(ref);
      setDelegate(found);
      setResult(found ? null : { ok: false, message: `No delegate matches ${ref}.` });
    });
  }

  function act(fn: () => Promise<ActionResult>) {
    startTransition(async () => {
      const outcome = await fn();
      setResult(outcome);
      if (outcome.ok && delegate) setDelegate(await lookupDelegate(delegate.ref));
    });
  }

  return (
    <div className="scanner">
      <div>
        <div className="scanner__view">
          <video ref={videoRef} playsInline muted />
          {scanning && <div className="scanner__reticle" aria-hidden="true" />}
          {!scanning && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'grid',
                placeItems: 'center',
                textAlign: 'center',
                padding: 24,
              }}
            >
              <p className="readout">CAMERA OFF</p>
            </div>
          )}
        </div>
        <canvas ref={canvasRef} hidden />

        <div className="row-actions" style={{ marginTop: 14 }}>
          {scanning ? (
            <button className="btn-mini" onClick={stopCamera}>
              Stop camera
            </button>
          ) : (
            <button className="btn-mini" onClick={startCamera}>
              Start camera
            </button>
          )}
        </div>

        {cameraError && (
          <div className="alert" data-tone="info" style={{ marginTop: 14 }}>
            <span className="alert__mark" aria-hidden="true">i</span>
            <span>{cameraError}</span>
          </div>
        )}
      </div>

      <div>
        <form
          className="toolbar"
          onSubmit={(e) => {
            e.preventDefault();
            if (manual.trim()) load(manual.trim());
          }}
        >
          <input
            className="input"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="LM1-XXXXX"
            aria-label="Delegate reference"
          />
          <button className="btn-mini" type="submit" disabled={pending}>
            Look up
          </button>
        </form>

        {result && (
          <div
            className="alert"
            data-tone={result.ok ? 'success' : 'error'}
            role="status"
            style={{ marginBottom: 18 }}
          >
            <span className="alert__mark" aria-hidden="true">{result.ok ? '✓' : '!'}</span>
            <span>{result.message}</span>
          </div>
        )}

        {delegate ? (
          <section className="dash-card">
            <div className="dash-card__head">
              <h2 className="dash-card__title">{delegate.name}</h2>
              <span className="pill" data-tone={delegate.status}>
                {STATUS_LABEL[delegate.status as keyof typeof STATUS_LABEL]}
              </span>
            </div>
            <div className="dash-card__body">
              <dl className="kv">
                <dt>REFERENCE</dt>
                <dd className="mono">{delegate.ref}</dd>
                <dt>SCHOOL</dt>
                <dd>{delegate.school}</dd>
                <dt>COMMITTEE</dt>
                <dd>{delegate.committee ?? 'Not allocated'}</dd>
                <dt>PORTFOLIO</dt>
                <dd>{delegate.country ?? '-'}</dd>
                <dt>CHECKED IN</dt>
                <dd>{delegate.checkedInAt ? formatDateTime(delegate.checkedInAt) : 'Not yet'}</dd>
                <dt>KIT</dt>
                <dd>{delegate.kitGivenAt ? formatDateTime(delegate.kitGivenAt) : 'Not issued'}</dd>
              </dl>

              <div className="row-actions" style={{ marginTop: 22 }}>
                <button
                  className="btn-mini"
                  data-tone="approve"
                  disabled={pending || !!delegate.checkedInAt}
                  onClick={() => act(() => checkIn(delegate.ref))}
                >
                  {delegate.checkedInAt ? 'Already checked in' : 'Check in'}
                </button>
                <button
                  className="btn-mini"
                  disabled={pending || !!delegate.kitGivenAt}
                  onClick={() => act(() => giveKit(delegate.ref))}
                >
                  {delegate.kitGivenAt ? 'Kit issued' : 'Issue kit'}
                </button>
              </div>
            </div>
          </section>
        ) : (
          <div className="empty-state">
            <p className="empty-state__mark">[ SCAN ]</p>
            <p>Point the camera at a delegate&rsquo;s pass, or type their reference.</p>
          </div>
        )}
      </div>
    </div>
  );
}
