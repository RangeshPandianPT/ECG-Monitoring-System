import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Activity, AlertTriangle, Power, Trash2, Wifi, Heart, Info, Lightbulb, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export const ECGMonitor = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [leadsOff, setLeadsOff] = useState(false);
  const [ecgData, setEcgData] = useState([]);
  const [currentValue, setCurrentValue] = useState(0);
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  const portRef = useRef(null);
  const readerRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const demoIntervalRef = useRef(null);

  // Check if Web Serial API is supported
  const isSerialSupported = 'serial' in navigator;

  // Generate realistic ECG waveform data
  const generateECGSample = (t) => {
    // Simulate a realistic ECG pattern (PQRST wave)
    const heartRate = 75; // BPM
    const beatDuration = 60000 / heartRate; // ms per beat
    const phase = (t % beatDuration) / beatDuration;
    
    let value = 512; // baseline
    
    // P wave (atrial depolarization)
    if (phase >= 0.0 && phase < 0.1) {
      value += 30 * Math.sin((phase - 0.0) / 0.1 * Math.PI);
    }
    // PR segment
    else if (phase >= 0.1 && phase < 0.2) {
      value += 0;
    }
    // Q wave
    else if (phase >= 0.2 && phase < 0.22) {
      value -= 20 * Math.sin((phase - 0.2) / 0.02 * Math.PI);
    }
    // R wave (ventricular depolarization - tallest peak)
    else if (phase >= 0.22 && phase < 0.26) {
      value += 250 * Math.sin((phase - 0.22) / 0.04 * Math.PI);
    }
    // S wave
    else if (phase >= 0.26 && phase < 0.28) {
      value -= 40 * Math.sin((phase - 0.26) / 0.02 * Math.PI);
    }
    // ST segment
    else if (phase >= 0.28 && phase < 0.4) {
      value += 0;
    }
    // T wave (ventricular repolarization)
    else if (phase >= 0.4 && phase < 0.55) {
      value += 50 * Math.sin((phase - 0.4) / 0.15 * Math.PI);
    }
    
    // Add small noise for realism
    value += (Math.random() - 0.5) * 5;
    
    return Math.max(0, Math.min(1023, Math.round(value)));
  };

  // Connect to Arduino
  const connectToArduino = async () => {
    if (!isSerialSupported) {
      toast.error("Web Serial API not supported in this browser");
      return;
    }

    try {
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });
      
      portRef.current = port;
      setIsConnected(true);
      toast.success("Connected to Arduino");
      
      startReading();
    } catch (error) {
      console.error("Connection error:", error);
      toast.error("Failed to connect to Arduino");
    }
  };

  // Disconnect from Arduino
  const disconnect = async () => {
    try {
      if (readerRef.current) {
        await readerRef.current.cancel();
        readerRef.current = null;
      }
      
      if (portRef.current) {
        await portRef.current.close();
        portRef.current = null;
      }
      
      setIsConnected(false);
      setIsMonitoring(false);
      toast.info("Disconnected from Arduino");
    } catch (error) {
      console.error("Disconnect error:", error);
    }
  };

  // Read data from serial port
  const startReading = async () => {
    if (!portRef.current) return;

    const decoder = new TextDecoderStream();
    portRef.current.readable.pipeTo(decoder.writable);
    const reader = decoder.readable.getReader();
    readerRef.current = reader;

    let buffer = "";

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += value;
        const lines = buffer.split('\n');
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          
          if (trimmed === "!") {
            setLeadsOff(true);
            setTimeout(() => setLeadsOff(false), 3000);
          } else if (trimmed) {
            const numValue = parseInt(trimmed);
            if (!isNaN(numValue)) {
              const timestamp = Date.now();
              setCurrentValue(numValue);
              
              setEcgData(prev => {
                const newData = [...prev, { time: timestamp, value: numValue }];
                return newData.slice(-500);
              });
            }
          }
        }
      }
    } catch (error) {
      console.error("Reading error:", error);
      toast.error("Connection lost");
      disconnect();
    }
  };

  // Draw ECG waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isMonitoring) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    const draw = () => {
      const container = canvas.parentElement;
      if (!container) return;

      const cssWidth = container.clientWidth;
      const cssHeight = container.clientHeight;

      const pixelWidth = Math.max(1, Math.floor(cssWidth * dpr));
      const pixelHeight = Math.max(1, Math.floor(cssHeight * dpr));

      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
        canvas.style.width = `${cssWidth}px`;
        canvas.style.height = `${cssHeight}px`;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
      }

      const width = cssWidth;
      const height = cssHeight;

      ctx.fillStyle = "hsl(var(--medical-bg))";
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = "hsl(var(--medical-grid))";
      ctx.lineWidth = 0.5;

      for (let x = 0; x < width; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      for (let y = 0; y < height; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      if (ecgData.length > 1) {
        ctx.strokeStyle = leadsOff ? "hsl(0, 85%, 50%)" : "hsl(var(--medical-trace))";
        ctx.lineWidth = 2.5;
        ctx.beginPath();

        const timeSpan = 5000; // 5 seconds
        const latestTime = ecgData[ecgData.length - 1].time;

        ecgData.forEach((point, index) => {
          const x = ((point.time - (latestTime - timeSpan)) / timeSpan) * width;
          const y = height - (point.value / 1024) * height;

          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });

        ctx.stroke();
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [ecgData, isMonitoring, leadsOff]);

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (!container) return;
      const dpr = window.devicePixelRatio || 1;
      const cssWidth = container.clientWidth;
      const cssHeight = container.clientHeight;

      canvas.width = Math.max(1, Math.floor(cssWidth * dpr));
      canvas.height = Math.max(1, Math.floor(cssHeight * dpr));
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  const toggleMonitoring = () => {
    if (!isConnected && !isDemoMode) {
      toast.error("Please connect to Arduino or enable demo mode first");
      return;
    }
    setIsMonitoring(!isMonitoring);
  };

  const toggleDemoMode = () => {
    if (isConnected) {
      toast.error("Disconnect from Arduino first");
      return;
    }
    
    const newDemoMode = !isDemoMode;
    setIsDemoMode(newDemoMode);
    
    if (newDemoMode) {
      toast.success("Demo mode enabled");
      setIsMonitoring(true);
    } else {
      setIsMonitoring(false);
      setEcgData([]);
      toast.info("Demo mode disabled");
    }
  };

  // Demo mode data generation
  useEffect(() => {
    if (!isDemoMode || !isMonitoring) {
      if (demoIntervalRef.current) {
        clearInterval(demoIntervalRef.current);
      }
      return;
    }

    const startTime = Date.now();
    
    demoIntervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const value = generateECGSample(elapsed);
      
      setCurrentValue(value);
      setEcgData(prev => {
        const newData = [...prev, { time: Date.now(), value }];
        return newData.slice(-500);
      });
      
      // Randomly trigger leads-off warning (5% chance)
      if (Math.random() < 0.001) {
        setLeadsOff(true);
        setTimeout(() => setLeadsOff(false), 3000);
      }
    }, 10); // 100Hz sampling rate

    return () => {
      if (demoIntervalRef.current) {
        clearInterval(demoIntervalRef.current);
      }
    };
  }, [isDemoMode, isMonitoring]);

  const clearData = () => {
    setEcgData([]);
    toast.info("Data cleared");
  };

  const healthFacts = [
    {
      icon: Heart,
      title: "Normal Heart Rate",
      description: "A healthy resting heart rate ranges from 60-100 beats per minute for adults."
    },
    {
      icon: TrendingUp,
      title: "ECG Patterns",
      description: "An ECG shows the P wave (atrial activity), QRS complex (ventricular contraction), and T wave (recovery)."
    },
    {
      icon: Activity,
      title: "Regular Monitoring",
      description: "Regular ECG monitoring can help detect arrhythmias, heart attacks, and other cardiac conditions early."
    }
  ];

  const tips = [
    "Ensure electrodes are properly attached to clean, dry skin for accurate readings",
    "Minimize patient movement during recording to reduce artifacts",
    "Check cable connections if you see a 'Leads Off' warning",
    "Standard ECG recording speed is 25mm/s with 10mm/mV amplitude",
    "Always compare current ECG with previous recordings to detect changes"
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
      <div className="mb-6">
        {/* Stack header on small screens, row on sm+ */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Activity className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Professional ECG Monitor</h1>
                <p className="text-sm text-muted-foreground">Real-time cardiac monitoring system</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isConnected && (
                <Badge variant="outline" className="flex items-center gap-2 px-3 py-2 bg-success/10 text-success border-success/30">
                  <Wifi className="w-4 h-4 animate-pulse" />
                  Connected
                </Badge>
              )}
              {isDemoMode && (
                <Badge variant="outline" className="px-3 py-2 bg-accent/10 text-accent border-accent/30">
                  Demo Mode
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Alerts */}
            {leadsOff && (
              <Alert className="border-destructive bg-destructive/10">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <AlertDescription className="text-destructive font-semibold">
                  Leads Off! Check electrode connections.
                </AlertDescription>
              </Alert>
            )}

            {!isSerialSupported && (
              <Alert className="border-destructive bg-destructive/10">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <AlertDescription className="text-destructive">
                  Web Serial API is not supported in this browser. Please use Chrome, Edge, or Opera.
                </AlertDescription>
              </Alert>
            )}

            {/* Controls */}
            <Card className="p-6 shadow-md">
              <div className="flex flex-wrap gap-3">
                {!isConnected && !isDemoMode ? (
                  <>
                    <Button
                      onClick={connectToArduino}
                      disabled={!isSerialSupported}
                      size="lg"
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Power className="w-4 h-4 mr-2" />
                      Connect to Arduino
                    </Button>
                    <Button
                      onClick={toggleDemoMode}
                      variant="secondary"
                      size="lg"
                    >
                      <Activity className="w-4 h-4 mr-2" />
                      Enable Demo Mode
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={toggleMonitoring}
                      size="lg"
                      variant={isMonitoring ? "destructive" : "default"}
                      className={!isMonitoring ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}
                    >
                      {isMonitoring ? "Stop" : "Start"} Monitoring
                    </Button>
                    <Button onClick={clearData} variant="secondary" size="lg">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear Data
                    </Button>
                    {isConnected && (
                      <Button onClick={disconnect} variant="outline" size="lg">
                        Disconnect
                      </Button>
                    )}
                    {isDemoMode && (
                      <Button onClick={toggleDemoMode} variant="outline" size="lg">
                        Exit Demo Mode
                      </Button>
                    )}
                  </>
                )}
              </div>
            </Card>

            {/* ECG Display */}
            <Card className="p-6 shadow-md">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    ECG Waveform
                  </h2>
                  {isMonitoring && (
                    <div className="flex items-center gap-4">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Signal:</span>
                        <span className="ml-2 text-primary font-mono font-semibold">{currentValue}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">HR:</span>
                        <span className="ml-2 text-primary font-mono font-semibold">75 BPM</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="relative w-full h-64 sm:h-80 md:h-96 lg:h-[400px] rounded-lg overflow-hidden border-2 border-border shadow-inner">
                  <canvas
                    ref={canvasRef}
                    className="w-full h-full"
                  />
                  {!isMonitoring && (
                    <div className="absolute inset-0 flex items-center justify-center bg-card/80 backdrop-blur-sm">
                      <div className="text-center">
                        <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                        <p className="text-muted-foreground font-medium">
                          {isConnected || isDemoMode ? "Click Start Monitoring to begin" : "Connect to device or enable demo mode"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Instructions */}
            <Card className="p-6 bg-secondary/50 shadow-md">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="text-sm space-y-3">
                  <p className="font-semibold text-foreground">Connection Instructions:</p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold mt-0.5">•</span>
                      <span>Connect your Arduino ECG device via USB port</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold mt-0.5">•</span>
                      <span>Click "Connect to Arduino" and select the serial port</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold mt-0.5">•</span>
                      <span>Ensure data transmission at 9600 baud rate</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold mt-0.5">•</span>
                      <span>Send analog values (0-1023) as newline-separated integers</span>
                    </li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar - Health Facts & Tips */}
          <div className="space-y-6">
            {/* Health Facts */}
            <Card className="p-6 shadow-md">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                Health Facts
              </h3>
              <div className="space-y-4">
                {healthFacts.map((fact, index) => (
                  <div key={index} className="p-4 bg-secondary/50 rounded-lg border border-border">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                        <fact.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground text-sm mb-1">{fact.title}</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">{fact.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Professional Tips */}
            <Card className="p-6 shadow-md">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-accent" />
                Professional Tips
              </h3>
              <div className="space-y-3">
                {tips.map((tip, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-accent/5 rounded-lg border border-accent/20">
                    <span className="text-accent font-bold text-sm flex-shrink-0">{index + 1}.</span>
                    <p className="text-xs text-muted-foreground leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Quick Stats */}
            <Card className="p-6 shadow-md bg-gradient-to-br from-primary/5 to-accent/5">
              <h3 className="text-lg font-semibold text-foreground mb-4">Quick Reference</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-card rounded-lg border border-border">
                  <span className="text-sm text-muted-foreground">Normal HR</span>
                  <span className="text-sm font-bold text-primary">60-100 BPM</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-card rounded-lg border border-border">
                  <span className="text-sm text-muted-foreground">Sampling Rate</span>
                  <span className="text-sm font-bold text-primary">100 Hz</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-card rounded-lg border border-border">
                  <span className="text-sm text-muted-foreground">Resolution</span>
                  <span className="text-sm font-bold text-primary">10-bit ADC</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
