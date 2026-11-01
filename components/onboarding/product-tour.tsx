"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { driver, type DriveStep } from "driver.js";

const STORAGE_KEY = "it_product_tour_seen_v1";

export function ProductTour() {
  const pathname = usePathname();
  const started = useRef(false);

  useEffect(() => {
    if (pathname !== "/dashboard" || started.current) return;

    const query = new URLSearchParams(window.location.search);
    const forced = query.get("tour") === "1";
    const requested = query.get("welcome") === "1" || forced;
    const alreadySeen = window.localStorage.getItem(STORAGE_KEY) === "true";

    if (!requested || (alreadySeen && !forced)) return;

    const timer = window.setTimeout(() => {
      const steps: DriveStep[] = [
        {
          element: '[data-tour="dashboard-metrics"]',
          popover: {
            title: "Your search at a glance",
            description:
              "These four numbers keep the whole search honest: applications, responses, follow-ups, and interviews.",
            side: "bottom",
            align: "start",
          },
        },
        {
          element: '[data-tour="recent-applications"]',
          popover: {
            title: "Every conversation in one place",
            description:
              "Your latest applications live here. Open one to see its emails, notes, and full timeline.",
            side: "bottom",
            align: "start",
          },
        },
        {
          element: '[data-tour="nav-applications"]',
          popover: {
            title: "Start with one application",
            description:
              "Add a role, the company, and your first email. The tracker builds the follow-up schedule around you.",
            side: "right",
            align: "center",
          },
        },
        {
          element: '[data-tour="nav-follow-ups"]',
          popover: {
            title: "Never let a follow-up slip",
            description:
              "When a date comes due, it appears here and on your dashboard. Log the email and the next date is suggested.",
            side: "right",
            align: "center",
          },
        },
        {
          element: '[data-tour="nav-templates"]',
          popover: {
            title: "Stop rewriting the same email",
            description:
              "Save cold outreach, follow-ups, and replies once. Templates fill in the company, role, and contact automatically.",
            side: "right",
            align: "center",
          },
        },
        {
          element: '[data-tour="help-center"]',
          popover: {
            title: "Need a hand?",
            description:
              "Open Help Center for shortcuts, this tour, and a way to reach us. You can always start the tour again from here.",
            side: "right",
            align: "center",
          },
        },
      ];

      const visibleSteps = steps.filter((step) => {
        if (typeof step.element !== "string") return false;
        const element = document.querySelector(step.element);
        return element instanceof HTMLElement && element.offsetParent !== null;
      });

      if (visibleSteps.length === 0) {
        window.localStorage.setItem(STORAGE_KEY, "true");
        return;
      }

      started.current = true;
      const tour = driver({
        showProgress: true,
        progressText: "Step {{current}} of {{total}}",
        nextBtnText: "Next",
        prevBtnText: "Back",
        doneBtnText: "Done",
        allowClose: true,
        overlayColor: "rgba(15, 17, 21, 0.58)",
        stagePadding: 6,
        stageRadius: 12,
        popoverClass: "it-product-tour",
        steps: visibleSteps,
        onDestroyed: () => {
          window.localStorage.setItem(STORAGE_KEY, "true");
          window.history.replaceState({}, "", "/dashboard");
        },
      });

      tour.drive();
    }, 650);

    return () => window.clearTimeout(timer);
  }, [pathname]);

  return null;
}
