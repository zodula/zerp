import { useEffect, useRef, useState } from "react";
import { type RealtimeSocketStatus, zodula } from "@/zodula/client";
import type { FaceApiShape } from "@/zodula/client/zodula_face";
import { Button } from "@/zodula/ui/components/ui/button";
import { configureToast, toast } from "@/zodula/ui/components/ui/toast";
import { popup } from "@/zodula/ui/components/ui/popit";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/zodula/ui/components/ui/dropdown-menu";
import { CheckCircle2, Loader2, Menu, RefreshCcw, Users } from "lucide-react";

type FaceProfile = {
  employee: string;
  employee_name: string;
  descriptor: number[];
};

type KioskEmployee = {
  id: string;
  name: string;
};

function realtimeStatusUi(s: RealtimeSocketStatus): { label: string; dotClass: string } {
  switch (s.state) {
    case "open":
      return { label: "Live", dotClass: "zd:bg-emerald-500" };
    case "connecting":
      return { label: "Connecting", dotClass: "zd:bg-amber-400 zd:animate-pulse" };
    case "closing":
      return { label: "Closing", dotClass: "zd:bg-amber-500" };
    case "closed":
    case "idle":
    default:
      return { label: "Offline", dotClass: "zd:bg-zinc-500" };
  }
}

function formatNowDateTime(): string {
  return zodula.utils.format(new Date(), "datetime");
}

export default function EmployeeKioskPage() {
  const [kioskName, setKioskName] = useState("Employee Kiosk");
  const [kioskSetupRequired, setKioskSetupRequired] = useState(false);
  const [kioskSetupMessage, setKioskSetupMessage] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const [loadingModels, setLoadingModels] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [kioskEmployees, setKioskEmployees] = useState<KioskEmployee[]>([]);
  const [profiles, setProfiles] = useState<FaceProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeSocketStatus>(() => zodula.realtime.getSocketStatus());

  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const faceApiRef = useRef<FaceApiShape | null>(null);

  useEffect(() => {
    configureToast({ position: "top-center" });
    return () => {
      configureToast({ position: "top-right" });
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingModels(true);
        const faceapi = await zodula.face.ensureFaceApiScript();
        faceApiRef.current = faceapi;
        await zodula.face.loadFaceApiModelsFromPublic(faceapi, window.location.origin);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Failed to initialize face model";
        if (!cancelled) toast.error("Face model error", msg);
      } finally {
        if (!cancelled) setLoadingModels(false);
      }
    })();
    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (loadingModels) return;
    if (cameraReady) return;
    startCamera();
  }, [loadingModels, cameraReady]);

  useEffect(() => {
    let cancelled = false;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const applyKioskResponse = (res: any) => {
      const name = res?.kiosk_name;
      if (name) setKioskName(String(name));
      const needsSetup = !!res?.needs_setup;
      setKioskSetupRequired(needsSetup);
      setKioskSetupMessage(String(res?.message || ""));
      const employees = Array.isArray(res?.employees) ? res.employees : [];
      setKioskEmployees(
        employees
          .map((e: any) => ({ id: String(e?.id || ""), name: String(e?.name || e?.id || "") }))
          .filter((e: KioskEmployee) => !!e.id)
      );
      const docs = res?.rows || [];
      const parsed: FaceProfile[] = (docs || [])
        .map((d: any) => {
          const descriptor = zodula.face.parseFaceDescriptor(d.face_descriptor);
          if (!descriptor) return null;
          return {
            employee: String(d.employee || ""),
            employee_name: String(d.employee_name || d.employee || ""),
            descriptor,
          };
        })
        .filter(Boolean) as FaceProfile[];
      setProfiles(parsed);
    };

    const loadKioskFaceProfiles = async (opts?: { silent?: boolean }) => {
      if (cancelled) return;
      const silent = !!opts?.silent;
      if (!silent) setLoadingProfiles(true);
      try {
        const res = await zodula.action("zerp.hrms.kiosk_face_profiles" as any, { data: {} });
        if (cancelled) return;
        applyKioskResponse(res);
      } catch (e: any) {
        setKioskSetupRequired(true);
        if (!cancelled) toast.error("Face profile error", e?.message || "Failed to load face profiles");
      } finally {
        if (!cancelled && !silent) setLoadingProfiles(false);
      }
    };

    const onDoctypeChange = () => {
      if (cancelled) return;
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        debounceTimer = null;
        loadKioskFaceProfiles({ silent: true });
      }, 400);
    };

    loadKioskFaceProfiles();

    const rt = zodula.realtime;
    const offStatus = rt.onSocketStatusChange(setRealtimeStatus);
    const faceEvents = ["after_insert", "after_save", "after_delete"] as const;
    for (const ev of faceEvents) {
      rt.subscribe("Employee Face Data", ev, onDoctypeChange);
      rt.subscribe("Employee Kiosk", ev, onDoctypeChange);
    }

    return () => {
      cancelled = true;
      offStatus();
      for (const ev of faceEvents) {
        rt.unsubscribe("Employee Face Data", ev);
        rt.unsubscribe("Employee Kiosk", ev);
      }
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, []);

  const showKioskEmployees = async () => {
    await popup(KioskEmployeeListDialog, {
      title: "Employees in this kiosk",
      description: "Employees loaded by this kiosk's designation/department/branch filters.",
      maxWidth: 640,
    }, {
      employees: kioskEmployees,
      kioskName,
    });
  };

  const startCamera = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraReady(true);
    } catch (e: any) {
      setCameraReady(false);
      toast.error("Camera error", e?.message || "Unable to access camera");
    }
  };

  const doCheckin = async () => {
    if (!faceApiRef.current) {
      toast.error("Face model not ready");
      return;
    }
    if (kioskSetupRequired) {
      toast.error("Kiosk setup required", kioskSetupMessage || "Please configure Employee Kiosk first.");
      return;
    }
    if (!videoRef.current || !cameraReady) {
      toast.error("Camera not ready");
      return;
    }
    if (!profiles.length) {
      toast.error("No face profile", "Please create Employee Face Data first.");
      return;
    }
    try {
      setIsProcessing(true);
      const faceapi = faceApiRef.current;
      const detection = await faceapi
        .detectSingleFace(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions({ ...zodula.face.TINY_FACE_DETECTOR_OPTIONS })
        )
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection?.descriptor) {
        toast.error("No face detected", "Please face the camera and try again.");
        return;
      }

      const descriptor = Array.from(detection.descriptor);
      const best = zodula.face.findBestFaceMatch(descriptor, profiles, zodula.face.FACE_MATCH_THRESHOLD);
      if (!best) {
        toast.error("Face not recognized", "No matching employee profile.");
        return;
      }

      await zodula.doc.create_doc("Employee Checkin", {
        employee: best.profile.employee,
        check_time: formatNowDateTime(),
        attendance_date: zodula.utils.format(new Date(), "date"),
        employee_kiosk: kioskName,
      } as any);

      toast.success("Check-in recorded", `${best.profile.employee_name} (${best.profile.employee})`);
    } catch (e: any) {
      toast.error("Check-in error", e?.message || "Failed to create Employee Checkin");
    } finally {
      setIsProcessing(false);
    }
  };

  const rtUi = realtimeStatusUi(realtimeStatus);

  return (
    <div className="zd:relative zd:min-h-screen zd:bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="zd:h-screen zd:w-screen zd:object-cover"
      />
      <div className="zd:pointer-events-none zd:absolute zd:inset-0 zd:bg-gradient-to-b zd:from-black/35 zd:via-transparent zd:to-black/45" />

      <div className="zd:absolute zd:left-3 zd:top-3 zd:z-30">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="zd:bg-background/90">
              <Menu className="zd:h-4 zd:w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={showKioskEmployees}>
              <Users className="zd:h-4 zd:w-4" />
              Employees in kiosk
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => location.reload()}>
              <RefreshCcw className="zd:h-4 zd:w-4" />
              Reload
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="zd:absolute zd:right-3 zd:top-3 zd:z-30 zd:flex zd:flex-col zd:items-end zd:gap-1.5">
        <span
          className="zd:inline-flex zd:items-center zd:gap-1.5 zd:rounded-full zd:bg-background/80 zd:px-2.5 zd:py-1 zd:text-[11px] zd:text-foreground"
          title={`Realtime: ${realtimeStatus.state}${realtimeStatus.readyState != null ? ` (${realtimeStatus.readyState})` : ""}`}
        >
          <span className={`zd:h-1.5 zd:w-1.5 zd:shrink-0 zd:rounded-full ${rtUi.dotClass}`} aria-hidden />
          {rtUi.label}
        </span>
        <span className="zd:rounded-full zd:bg-background/80 zd:px-2.5 zd:py-1 zd:text-[11px] zd:text-foreground">
          {kioskName}
        </span>
      </div>

      <div className="zd:absolute zd:inset-x-0 zd:bottom-4 zd:z-30 zd:flex zd:justify-center zd:px-3">
        <div className="zd:flex zd:w-full zd:max-w-md zd:gap-2">
          <Button
            type="button"
            variant="solid"
            size="lg"
            className="zd:flex-1"
            onClick={doCheckin}
            disabled={kioskSetupRequired || loadingModels || loadingProfiles || isProcessing || !cameraReady}
          >
            {isProcessing ? <Loader2 className="zd:h-4 zd:w-4 zd:animate-spin" /> : <CheckCircle2 className="zd:h-4 zd:w-4" />}
            Check In
          </Button>
        </div>
      </div>
      {kioskSetupRequired ? (
        <div className="zd:absolute zd:inset-0 zd:z-40 zd:flex zd:items-center zd:justify-center zd:px-4">
          <div className="zd:max-w-lg zd:rounded-lg zd:border zd:border-border/70 zd:bg-background/95 zd:p-4 zd:text-center zd:shadow-lg">
            <p className="zd:text-sm zd:font-semibold zd:text-foreground">Employee Kiosk setup required</p>
            <p className="zd:mt-1 zd:text-xs zd:text-muted-foreground">
              {kioskSetupMessage || "This user has no active Employee Kiosk record. Please ask HR/Admin to configure one first."}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function KioskEmployeeListDialog({
  initialData,
}: {
  isOpen: boolean;
  onClose: (result?: any) => void;
  initialData?: { employees?: KioskEmployee[]; kioskName?: string };
}) {
  const employees = initialData?.employees || [];
  const kioskName = initialData?.kioskName || "Employee Kiosk";
  return (
    <div className="zd:space-y-3">
      <div className="zd:rounded-md zd:border zd:border-border/70 zd:bg-muted/40 zd:px-3 zd:py-2">
        <p className="zd:text-xs zd:text-muted-foreground">Kiosk</p>
        <p className="zd:text-sm zd:font-medium zd:text-foreground">{kioskName}</p>
      </div>
      <div className="zd:max-h-[60vh] zd:overflow-auto zd:rounded-md zd:border zd:border-border/70">
        {!employees.length ? (
          <div className="zd:p-3 zd:text-sm zd:text-muted-foreground">No employees in current kiosk scope.</div>
        ) : (
          <div className="zd:divide-y zd:divide-border/60">
            {employees.map((emp) => (
              <div key={emp.id} className="zd:flex zd:items-center zd:justify-between zd:gap-3 zd:px-3 zd:py-2">
                <span className="zd:text-sm zd:text-foreground">{emp.name || emp.id}</span>
                <span className="zd:rounded-full zd:bg-muted zd:px-2 zd:py-0.5 zd:text-xs zd:text-muted-foreground">{emp.id}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
