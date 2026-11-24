import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * 1. Geometry-matched Skeleton for KPI Metric Cards
 */
export function SkeletonKPICard({ className = '' }) {
  return (
    <div className={`bento-card p-5 rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[185px] ${className}`}>
      {/* Row 1: Eyebrow label + Jewel Squircle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full skeleton-wave"></div>
          <div className="h-3 w-24 skeleton-wave rounded-md"></div>
        </div>
        <div className="w-9 h-9 skeleton-wave rounded-2xl"></div>
      </div>

      {/* Row 2: Hero Metric + Context Badge */}
      <div className="flex items-baseline justify-between my-2">
        <div className="h-8 w-20 skeleton-wave rounded-lg"></div>
        <div className="h-5 w-16 skeleton-wave rounded-full"></div>
      </div>

      {/* Row 3: Fluid SVG spline curve placeholder */}
      <div className="space-y-1.5">
        <div className="h-5 w-full skeleton-wave rounded-md opacity-60"></div>
        <div className="flex items-center justify-between pt-1 border-t border-white/5">
          <div className="h-2.5 w-16 skeleton-wave rounded-md"></div>
          <div className="h-2.5 w-10 skeleton-wave rounded-md"></div>
        </div>
      </div>
    </div>
  );
}

/**
 * 2. Geometry-matched Skeleton for Spline Area Chart
 */
export function SkeletonAreaChart({ title = 'Synthesizing Telemetry...', className = '' }) {
  return (
    <div className={`bento-card p-6 rounded-3xl space-y-4 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
        <div className="space-y-1.5">
          <div className="h-4 w-60 skeleton-wave rounded-md"></div>
          <div className="h-3 w-40 skeleton-wave rounded-md"></div>
        </div>
        <div className="h-7 w-36 skeleton-wave rounded-xl"></div>
      </div>
      {/* SVG Spline Wave Placeholder */}
      <div className="h-64 w-full skeleton-wave rounded-2xl relative flex items-center justify-center">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-card/80 border border-border shadow-sm text-xs font-mono">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
          <span>{title}</span>
        </div>
      </div>
      <div className="flex justify-between pt-1">
        <div className="h-3 w-20 skeleton-wave rounded"></div>
        <div className="h-3 w-20 skeleton-wave rounded"></div>
        <div className="h-3 w-20 skeleton-wave rounded"></div>
        <div className="h-3 w-20 skeleton-wave rounded"></div>
      </div>
    </div>
  );
}

/**
 * 3. Geometry-matched Skeleton for Radial Donut Chart
 */
export function SkeletonDonutChart({ className = '' }) {
  return (
    <div className={`bento-card p-6 rounded-3xl space-y-4 ${className}`}>
      <div className="space-y-1.5 border-b border-border/40 pb-3">
        <div className="h-4 w-40 skeleton-wave rounded-md"></div>
        <div className="h-3 w-24 skeleton-wave rounded-md"></div>
      </div>
      <div className="relative w-44 h-44 mx-auto rounded-full skeleton-wave flex items-center justify-center">
        <div className="w-24 h-24 rounded-full bg-card"></div>
      </div>
      <div className="space-y-2 pt-2">
        <div className="h-8 w-full skeleton-wave rounded-xl"></div>
        <div className="h-8 w-full skeleton-wave rounded-xl"></div>
        <div className="h-8 w-full skeleton-wave rounded-xl"></div>
      </div>
    </div>
  );
}

/**
 * 4. Geometry-matched Skeleton for 6-Axis Radar Chart
 */
export function SkeletonRadarChart({ className = '' }) {
  return (
    <div className={`bento-card p-6 rounded-3xl space-y-4 ${className}`}>
      <div className="space-y-1.5 border-b border-border/40 pb-3">
        <div className="h-4 w-48 skeleton-wave rounded-md"></div>
        <div className="h-3 w-32 skeleton-wave rounded-md"></div>
      </div>
      <div className="relative w-52 h-52 mx-auto rounded-full skeleton-wave flex items-center justify-center">
        <div className="w-32 h-32 rounded-full border border-dashed border-border/40 animate-radar-sweep"></div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="h-3 w-full skeleton-wave rounded"></div>
        <div className="h-3 w-full skeleton-wave rounded"></div>
        <div className="h-3 w-full skeleton-wave rounded"></div>
      </div>
    </div>
  );
}

/**
 * 5. Geometry-matched Skeleton for Card Grids / Lists
 */
export function SkeletonCardGrid({ count = 3, className = '' }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-5 rounded-3xl bento-card space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="h-4 w-48 skeleton-wave rounded-md"></div>
            <div className="h-6 w-24 skeleton-wave rounded-full"></div>
          </div>
          <div className="h-3 w-full skeleton-wave rounded"></div>
          <div className="h-3 w-3/4 skeleton-wave rounded"></div>
        </div>
      ))}
    </div>
  );
}

/**
 * 6. Geometry-matched Skeleton for Multi-Stage Loading Pipeline
 */
export function SkeletonPipeline({ steps = 4, className = '' }) {
  return (
    <div className={`bento-card p-6 rounded-3xl space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 skeleton-wave rounded-full"></div>
          <div className="h-4 w-44 skeleton-wave rounded-md"></div>
        </div>
        <div className="h-4 w-12 skeleton-wave rounded-full"></div>
      </div>
      {/* Progress ribbon skeleton */}
      <div className="h-2 w-full skeleton-wave rounded-full"></div>
      {/* Pipeline steps */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
        {Array.from({ length: steps }).map((_, i) => (
          <div key={i} className="p-3 rounded-2xl bg-card/60 border border-border/40 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 skeleton-wave rounded-full"></div>
              <div className="h-3 w-16 skeleton-wave rounded"></div>
            </div>
            <div className="h-2.5 w-full skeleton-wave rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 7. Geometry-matched Skeleton for Profile & Resume Review
 */
export function SkeletonProfileReview({ className = '' }) {
  return (
    <div className={`space-y-6 ${className}`}>
      <div className="bento-card p-6 sm:p-7 rounded-3xl flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-64 skeleton-wave rounded-lg"></div>
          <div className="h-3.5 w-40 skeleton-wave rounded-md"></div>
        </div>
        <div className="flex gap-3">
          <div className="h-9 w-20 skeleton-wave rounded-xl"></div>
          <div className="h-9 w-32 skeleton-wave rounded-xl"></div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-4 bento-card p-6 rounded-3xl space-y-4">
          <div className="w-20 h-20 skeleton-wave rounded-2xl mx-auto"></div>
          <div className="h-5 w-36 skeleton-wave rounded-md mx-auto"></div>
          <div className="h-3 w-48 skeleton-wave rounded mx-auto"></div>
          <div className="space-y-2 pt-3 border-t border-border/40">
            <div className="h-3 w-full skeleton-wave rounded"></div>
            <div className="h-3 w-full skeleton-wave rounded"></div>
            <div className="h-3 w-2/3 skeleton-wave rounded"></div>
          </div>
        </div>
        <div className="lg:col-span-8 space-y-4">
          <div className="bento-card p-6 rounded-3xl space-y-4">
            <div className="h-5 w-44 skeleton-wave rounded-md"></div>
            <div className="flex flex-wrap gap-2 pt-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-7 w-24 skeleton-wave rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
