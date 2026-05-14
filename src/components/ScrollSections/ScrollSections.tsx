import {
  KeyboardArrowDownRounded,
  KeyboardArrowUpRounded,
} from "@mui/icons-material";

import {
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import "./ScrollSections.css";

export type ScrollSection = {
  id: string;
  icon?: ReactNode;
  blockCount?: number;
  dotTone?: "green" | "blue" | "red";
  eyebrow?: ReactNode;
  title: ReactNode;
  body: ReactNode;
};

export type ScrollSectionsProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  sections: ScrollSection[];
  stickyTop?: number;
};

type SectionMetrics = {
  fullHeight: number;
  gapAfter: number;
  headerHeight: number;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const getSectionTravel = (metrics: SectionMetrics, isLastSection: boolean) => {
  if (isLastSection) {
    return 0;
  }

  const bodyHeight = Math.max(0, metrics.fullHeight - metrics.headerHeight);
  return bodyHeight + metrics.headerHeight + metrics.gapAfter;
};

const getVisualTravelLimit = (
  metrics: SectionMetrics[],
  stickyViewportHeight: number,
  sectionGap: number,
) => {
  const previousSectionsTravel = metrics
    .slice(0, -1)
    .reduce(
      (sum, sectionMetrics, index) =>
        sum + getSectionTravel(sectionMetrics, index === metrics.length - 1),
      0,
    );
  const lastSectionHeight = metrics.at(-1)?.fullHeight ?? 0;

  return Math.max(
    0,
    previousSectionsTravel - Math.max(0, stickyViewportHeight - (lastSectionHeight + sectionGap)),
  );
};

const getVisibleSectionIndexes = (metrics: SectionMetrics[], scrollDistance: number) => {
  let remainingScroll = scrollDistance;
  const visibleIndexes: number[] = [];

  metrics.forEach((sectionMetrics, index) => {
    const isLastSection = index === metrics.length - 1;
    const bodyHeight = Math.max(0, sectionMetrics.fullHeight - sectionMetrics.headerHeight);
    const sectionTravel = getSectionTravel(sectionMetrics, isLastSection);
    const consumedScroll = Math.min(remainingScroll, sectionTravel);
    const visibleBodyHeight = isLastSection
      ? bodyHeight
      : Math.max(0, bodyHeight - Math.min(consumedScroll, bodyHeight));

    if (visibleBodyHeight > 0.5) {
      visibleIndexes.push(index);
    }

    remainingScroll = Math.max(0, remainingScroll - sectionTravel);
  });

  return visibleIndexes;
};

const getActivationTail = (
  metrics: SectionMetrics[],
  visualTravelLimit: number,
  sectionGap: number,
) => {
  const indexes = getVisibleSectionIndexes(metrics, visualTravelLimit);
  const height = indexes.reduce(
    (sum, index) => sum + Math.max(metrics[index]?.headerHeight ?? 0, sectionGap),
    0,
  );
  const step = Math.max(1, height / Math.max(1, indexes.length));

  return { height, indexes, step };
};

export function ScrollSections({
  sections,
  stickyTop = 0,
  className,
  style,
  ...props
}: ScrollSectionsProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<Array<HTMLElement | null>>([]);
  const headerRefs = useRef<Array<HTMLElement | null>>([]);
  const bodyInnerRefs = useRef<Array<HTMLDivElement | null>>([]);
  const metricsRef = useRef<SectionMetrics[]>([]);
  const frameRef = useRef<number | null>(null);
  const activeIndexRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [virtualScrollHeight, setVirtualScrollHeight] = useState<number | null>(null);

  const rootStyle = useMemo(
    () =>
      ({
        ...style,
        "--sticky-top": `${stickyTop}px`,
        ...(virtualScrollHeight === null
          ? {}
          : { "--scroll-sections-height": `${virtualScrollHeight}px` }),
      }) as CSSProperties,
    [stickyTop, style, virtualScrollHeight],
  );

  const measure = useCallback(() => {
    const root = rootRef.current;
    const sectionGap = root
      ? Number.parseFloat(getComputedStyle(root).getPropertyValue("--section-gap")) || 0
      : 0;

    metricsRef.current = sectionRefs.current.map((section, index) => {
      const header = headerRefs.current[index];
      const bodyInner = bodyInnerRefs.current[index];

      if (!section) {
        return { fullHeight: 0, gapAfter: 0, headerHeight: 0 };
      }

      const headerHeight = header?.offsetHeight ?? 0;
      const bodyHeight = bodyInner?.offsetHeight ?? 0;
      return {
        fullHeight: headerHeight + bodyHeight,
        gapAfter: index === sectionRefs.current.length - 1 ? 0 : sectionGap,
        headerHeight,
      };
    });

    const stickyViewportHeight = Math.max(0, window.innerHeight - stickyTop);
    const visualTravelLimit = getVisualTravelLimit(
      metricsRef.current,
      stickyViewportHeight,
      sectionGap,
    );
    const activationTail = getActivationTail(metricsRef.current, visualTravelLimit, sectionGap);
    const nextVirtualScrollHeight = Math.max(
      window.innerHeight,
      visualTravelLimit + stickyViewportHeight + activationTail.height,
    );

    setVirtualScrollHeight((currentVirtualScrollHeight) =>
      currentVirtualScrollHeight !== null &&
      Math.abs(currentVirtualScrollHeight - nextVirtualScrollHeight) < 1
        ? currentVirtualScrollHeight
        : nextVirtualScrollHeight,
    );
  }, [sections.length, stickyTop]);

  const updateProgress = useCallback(() => {
    frameRef.current = null;

    const root = rootRef.current;
    const sectionGap = root
      ? Number.parseFloat(getComputedStyle(root).getPropertyValue("--section-gap")) || 0
      : 0;
    const stickyViewportHeight = Math.max(0, window.innerHeight - stickyTop);
    const visualTravelLimit = getVisualTravelLimit(
      metricsRef.current,
      stickyViewportHeight,
      sectionGap,
    );
    const rootTop = root ? root.getBoundingClientRect().top + window.scrollY : 0;
    const rawRemainingScroll = Math.max(0, window.scrollY + stickyTop - rootTop);
    const activationTailScroll = Math.max(0, rawRemainingScroll - visualTravelLimit);
    let remainingScroll = Math.min(rawRemainingScroll, visualTravelLimit);
    let nextActiveIndex = 0;
    let foundActiveSection = false;

    sectionRefs.current.forEach((section, index) => {
      if (!section) {
        return;
      }

      const metrics = metricsRef.current[index];
      if (!metrics || metrics.fullHeight === 0) {
        return;
      }

      const isLastSection = index === sectionRefs.current.length - 1;
      const bodyHeight = Math.max(0, metrics.fullHeight - metrics.headerHeight);
      const sectionTravel = getSectionTravel(metrics, isLastSection);
      const consumedScroll = Math.min(remainingScroll, sectionTravel);
      const bodyCollapseScroll = Math.min(consumedScroll, bodyHeight);
      const exitOffset = isLastSection
        ? 0
        : Math.min(Math.max(0, consumedScroll - bodyHeight), metrics.headerHeight + metrics.gapAfter);
      const visibleHeight = isLastSection
        ? metrics.fullHeight
        : metrics.headerHeight + Math.max(0, bodyHeight - bodyCollapseScroll);
      const visibleBodyHeight = isLastSection
        ? bodyHeight
        : Math.max(0, bodyHeight - bodyCollapseScroll);
      const visibleGap = isLastSection
        ? 0
        : metrics.gapAfter - exitOffset;
      const bodyCollapseDistance = Math.max(1, bodyHeight);
      const progress = clamp01(consumedScroll / bodyCollapseDistance);
      const viewportProgress = clamp01((index + progress) / Math.max(1, sections.length - 1));

      section.style.setProperty("--section-progress", progress.toFixed(4));
      section.style.setProperty("--section-viewport-progress", viewportProgress.toFixed(4));
      section.style.setProperty("--section-visible-height", `${visibleHeight}px`);
      section.style.setProperty("--section-visible-body-height", `${visibleBodyHeight}px`);
      section.style.setProperty("--section-visible-gap", `${visibleGap}px`);
      section.style.setProperty("--section-exit-offset", `${exitOffset}px`);

      const activeUntil = bodyHeight + metrics.headerHeight * 0.5;
      if (!foundActiveSection && (isLastSection || consumedScroll < activeUntil)) {
        nextActiveIndex = index;
        foundActiveSection = true;
      }

      remainingScroll = Math.max(0, remainingScroll - sectionTravel);
    });

    if (activationTailScroll > 0) {
      const activationTail = getActivationTail(metricsRef.current, visualTravelLimit, sectionGap);
      const activationIndex = Math.min(
        activationTail.indexes.length - 1,
        Math.floor(activationTailScroll / activationTail.step),
      );

      nextActiveIndex = activationTail.indexes[activationIndex] ?? nextActiveIndex;
    }

    if (nextActiveIndex !== activeIndexRef.current) {
      activeIndexRef.current = nextActiveIndex;
      setActiveIndex(nextActiveIndex);
    }
  }, [sections.length, stickyTop]);

  const scheduleUpdate = useCallback(() => {
    if (frameRef.current !== null) {
      return;
    }

    frameRef.current = window.requestAnimationFrame(updateProgress);
  }, [updateProgress]);

  useLayoutEffect(() => {
    measure();
    updateProgress();
  }, [measure, updateProgress, sections.length]);

  useEffect(() => {
    const handleResize = () => {
      measure();
      scheduleUpdate();
    };

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => {
            handleResize();
          });

    headerRefs.current.forEach((header) => {
      if (header) {
        resizeObserver?.observe(header);
      }
    });

    bodyInnerRefs.current.forEach((bodyInner) => {
      if (bodyInner) {
        resizeObserver?.observe(bodyInner);
      }
    });

    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", handleResize);
      resizeObserver?.disconnect();

      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, [measure, scheduleUpdate, sections.length]);

  const scrollToSection = useCallback(
    (index: number) => {
      const metrics = metricsRef.current[index];

      if (!metrics) {
        return;
      }

      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const root = rootRef.current;
      const sectionGap = root
        ? Number.parseFloat(getComputedStyle(root).getPropertyValue("--section-gap")) || 0
        : 0;
      const stickyViewportHeight = Math.max(0, window.innerHeight - stickyTop);
      const visualTravelLimit = getVisualTravelLimit(
        metricsRef.current,
        stickyViewportHeight,
        sectionGap,
      );
      const activationTail = getActivationTail(metricsRef.current, visualTravelLimit, sectionGap);
      const activationTailIndex = activationTail.indexes.indexOf(index);
      const rootTop = root ? root.getBoundingClientRect().top + window.scrollY : 0;
      const targetTravel =
        activationTailIndex === -1
          ? Math.min(
              visualTravelLimit,
              metricsRef.current
                .slice(0, index)
                .reduce(
                  (sum, sectionMetrics, sectionIndex) =>
                    sum + getSectionTravel(sectionMetrics, sectionIndex === metricsRef.current.length - 1),
                  0,
                ),
            )
          : visualTravelLimit + activationTail.step * activationTailIndex + 1;
      const targetTop = rootTop - stickyTop + targetTravel;
      const maxScrollTop = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const top = Math.min(targetTop, maxScrollTop);

      window.scrollTo({
        top,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    },
    [stickyTop],
  );

  return (
    <div
      ref={rootRef}
      className={["eq-scroll-sections", className].filter(Boolean).join(" ")}
      style={rootStyle}
      {...props}
    >
      <nav className="eq-scroll-sections__rail" aria-label="Section navigation">
        {sections.map((section, index) => (
          <button
            aria-current={activeIndex === index ? "step" : undefined}
            aria-label={`Scroll to ${typeof section.title === "string" ? section.title : section.id}`}
            className="eq-scroll-sections__railButton"
            key={section.id}
            onClick={() => scrollToSection(index)}
            type="button"
          >
            <span className="eq-scroll-sections__railIcon" aria-hidden="true">
              {section.icon ?? String(index + 1).padStart(2, "0")}
            </span>
            <span className="eq-scroll-sections__railDots" aria-hidden="true">
              {Array.from({ length: section.blockCount ?? 1 }, (_, dotIndex) => (
                <span
                  className={`eq-scroll-sections__railDot eq-scroll-sections__railDot--${
                    section.dotTone ?? "green"
                  }`}
                  key={dotIndex}
                />
              ))}
            </span>
          </button>
        ))}
      </nav>

      <div className="eq-scroll-sections__content">
        {sections.map((section, index) => (
          <section
            className={["eq-scroll-section", activeIndex === index ? "eq-scroll-section--active" : ""]
              .filter(Boolean)
              .join(" ")}
            id={section.id}
            key={section.id}
            ref={(node) => {
              sectionRefs.current[index] = node;
            }}
          >
            <header
              className="eq-scroll-section__header"
              ref={(node) => {
                headerRefs.current[index] = node;
              }}
            >
              <div className="eq-scroll-section__headerInner">
                <div className="eq-scroll-section__titleRow">
                  <span className="eq-scroll-section__activeIcon" aria-hidden="true">
                    {section.icon ?? String(index + 1).padStart(2, "0")}
                  </span>
                  <h2 className="eq-scroll-section__title">{section.title}</h2>
                </div>
                <div className="eq-scroll-section__headerMeta">
                  <div className="eq-scroll-section__headerNav" aria-label={`Navigate ${section.id} section`}>
                    <button
                      aria-label="Go to previous section"
                      className="eq-scroll-section__chevron"
                      disabled={index === 0}
                      onClick={() => scrollToSection(index - 1)}
                      type="button"
                    >
                      <KeyboardArrowUpRounded fontSize="small" />
                    </button>
                    <button
                      aria-label="Go to next section"
                      className="eq-scroll-section__chevron"
                      disabled={index === sections.length - 1}
                      onClick={() => scrollToSection(index + 1)}
                      type="button"
                    >
                      <KeyboardArrowDownRounded fontSize="small" />
                    </button>
                  </div>
                </div>
              </div>
            </header>

            <div className="eq-scroll-section__body">
              <div
                className="eq-scroll-section__bodyInner"
                ref={(node) => {
                  bodyInnerRefs.current[index] = node;
                }}
              >
                {section.body}
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
