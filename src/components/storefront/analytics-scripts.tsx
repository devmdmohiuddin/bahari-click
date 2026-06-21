"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";

import { GA_ID, META_PIXEL_ID, trackPageView } from "@/lib/analytics";

// Loads Meta Pixel + GA4 when their ids are configured (no-op otherwise) and
// fires a page_view on client-side route changes (S5.2).
export function AnalyticsScripts() {
  const pathname = usePathname();
  const firstRun = useRef(true);

  useEffect(() => {
    // The base snippets already send the initial page view on load.
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    trackPageView(pathname);
  }, [pathname]);

  if (!META_PIXEL_ID && !GA_ID) return null;

  return (
    <>
      {META_PIXEL_ID && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${META_PIXEL_ID}');fbq('track','PageView');`}
        </Script>
      )}

      {GA_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments);}
gtag('js',new Date());
gtag('config','${GA_ID}');`}
          </Script>
        </>
      )}
    </>
  );
}
