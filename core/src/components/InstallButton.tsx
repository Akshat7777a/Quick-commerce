import { useEffect, useState } from "react";
import { Download, MonitorDown, MoreVertical, Share } from "lucide-react";
import { getInstallState, promptInstall, subscribe, type InstallState } from "../lib/pwa";
import { useToast } from "../lib/toast";
import { cn } from "../lib/format";
import { Modal } from "./ui";

/**
 * "Install app" button for the store chrome.
 *
 * Chrome/Edge/Android: fires the browser's native install prompt.
 * iOS Safari / browsers with no prompt: opens a short how-to dialog, since
 * Safari only installs through Share → Add to Home Screen.
 * Hides itself once the app is running installed.
 */
export function InstallButton({ className }: { className?: string }) {
  const { toast } = useToast();
  const [state, setState] = useState<InstallState>(() => getInstallState());
  const [open, setOpen] = useState(false);

  useEffect(() => subscribe(() => setState(getInstallState())), []);

  if (state.installed) return null;

  const install = async () => {
    if (state.canPrompt) {
      const result = await promptInstall();
      if (result === "accepted") {
        toast("L MART added to your home screen.", "success");
        return;
      }
      if (result === "dismissed") return;
    }
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={install}
        aria-label="Install L MART on your device"
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 rounded-md bg-cream/12 px-2.5 py-1 text-[10.5px] font-medium text-cream ring-1 ring-inset ring-cream/25 transition hover:bg-cream/25 hover:text-cream",
          className,
        )}
      >
        <Download className="size-3" strokeWidth={2} />
        Install app
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Install L MART on your home screen"
        description="Open the store like an app: one tap from your home screen, no app store needed."
      >
        <InstallSteps platform={state.platform} />
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="btn btn-primary mt-6 w-full"
        >
          Got it
        </button>
      </Modal>
    </>
  );
}

function InstallSteps({ platform }: { platform: InstallState["platform"] }) {
  const steps =
    platform === "ios"
      ? [
          {
            icon: Share,
            title: "Tap the Share button",
            copy: "In Safari on iPhone it's the square with an arrow at the bottom of the screen.",
          },
          {
            icon: Download,
            title: 'Choose "Add to Home Screen"',
            copy: "Scroll the menu if you don't see it right away.",
          },
          {
            icon: MonitorDown,
            title: 'Tap "Add"',
            copy: "The L MART icon appears on your home screen and opens full-screen.",
          },
        ]
      : platform === "android"
        ? [
            {
              icon: MoreVertical,
              title: "Tap the ⋮ menu",
              copy: "Top-right corner of Chrome (or your browser's menu button).",
            },
            {
              icon: Download,
              title: 'Choose "Install app" or "Add to Home screen"',
              copy: 'Some browsers call it "Install L MART ONLINE".',
            },
            {
              icon: MonitorDown,
              title: "Confirm the install",
              copy: "It lands on your home screen and opens like a native app.",
            },
          ]
        : [
            {
              icon: MonitorDown,
              title: "Look for the install icon",
              copy: "A small install symbol on the right side of the address bar, or open the browser menu.",
            },
            {
              icon: Download,
              title: 'Choose "Install L MART ONLINE…"',
              copy: "In Safari on Mac it's File → Add to Dock.",
            },
            {
              icon: MonitorDown,
              title: "Confirm",
              copy: "The app opens in its own window, with its own taskbar or dock icon.",
            },
          ];

  return (
    <ol className="divide-y divide-line border-y border-line">
      {steps.map((step, index) => (
        <li key={step.title} className="flex gap-4 py-4 first:pt-0 last:pb-0">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-forest/10 text-forest">
            <step.icon className="size-4" strokeWidth={1.8} />
          </span>
          <div>
            <p className="flex items-center gap-2 text-[13.5px] font-medium text-ink">
              <span className="text-gold">{index + 1}.</span> {step.title}
            </p>
            <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-soft">{step.copy}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
