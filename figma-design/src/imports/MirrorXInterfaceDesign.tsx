import svgPaths from "./svg-o5dab5kib0";
import clsx from "clsx";
type BackgroundImage1Props = {
  additionalClassNames?: string;
};

function BackgroundImage1({ children, additionalClassNames = "" }: React.PropsWithChildren<BackgroundImage1Props>) {
  return (
    <div className={clsx("basis-0 grow min-h-px min-w-px relative shrink-0", additionalClassNames)}>
      <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-clip relative rounded-[inherit] size-full">{children}</div>
    </div>
  );
}

function BackgroundImage({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="absolute left-[20px] size-[18px] top-[11px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        {children}
      </svg>
    </div>
  );
}
type ContainerBackgroundImageProps = {
  additionalClassNames?: string;
};

function ContainerBackgroundImage({ children, additionalClassNames = "" }: React.PropsWithChildren<ContainerBackgroundImageProps>) {
  return (
    <div className={clsx("bg-[rgba(24,24,32,0.6)] relative rounded-[14px] shrink-0 w-full", additionalClassNames)}>
      <div aria-hidden="true" className="absolute border border-[rgba(48,48,58,0.3)] border-solid inset-0 pointer-events-none rounded-[14px]" />
      <div className="size-full">
        <div className="content-stretch flex flex-col gap-[12px] items-start pb-px pt-[17px] px-[17px] relative size-full">{children}</div>
      </div>
    </div>
  );
}

function IconBackgroundImage({ children }: React.PropsWithChildren<{}>) {
  return (
    <BackgroundImage>
      <g id="Icon">{children}</g>
    </BackgroundImage>
  );
}
type Icon4VectorBackgroundImageProps = {
  additionalClassNames?: string;
};

function Icon4VectorBackgroundImage({ additionalClassNames = "" }: Icon4VectorBackgroundImageProps) {
  return (
    <div className={clsx("absolute left-[16.67%] right-[16.67%]", additionalClassNames)}>
      <div className="absolute inset-[-0.83px_-6.25%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15 2">
          <path d="M0.833333 0.833333H14.1667" id="Vector" stroke="var(--stroke-0, #C4C4CF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
        </svg>
      </div>
    </div>
  );
}
type IdentityGraphBackgroundImageAndTextProps = {
  text: string;
};

function IdentityGraphBackgroundImageAndText({ text }: IdentityGraphBackgroundImageAndTextProps) {
  return (
    <div className="content-stretch flex h-[16px] items-start relative shrink-0 w-full">
      <p className="basis-0 font-['Inter:Regular',sans-serif] font-normal grow leading-[16px] min-h-px min-w-px not-italic relative shrink-0 text-[12px] text-[rgba(196,196,207,0.6)] tracking-[0.12px]">{text}</p>
    </div>
  );
}
type TextBackgroundImageAndTextProps = {
  text: string;
  additionalClassNames?: string;
};

function TextBackgroundImageAndText({ text, additionalClassNames = "" }: TextBackgroundImageAndTextProps) {
  return (
    <div className={clsx("h-[16px] relative shrink-0", additionalClassNames)}>
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[16px] left-0 not-italic text-[#cba35d] text-[12px] top-0 w-[27px]">{text}</p>
      </div>
    </div>
  );
}
type HeadingBackgroundImageAndTextProps = {
  text: string;
  additionalClassNames?: string;
};

function HeadingBackgroundImageAndText({ text, additionalClassNames = "" }: HeadingBackgroundImageAndTextProps) {
  return (
    <div className={clsx("h-[20px] relative shrink-0", additionalClassNames)}>
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['EB_Garamond:Regular',sans-serif] font-normal leading-[20px] left-0 text-[14px] text-neutral-200 text-nowrap top-0 whitespace-pre">{text}</p>
      </div>
    </div>
  );
}

export default function MirrorXInterfaceDesign() {
  return (
    <div className="bg-black relative size-full" data-name="MirrorX Interface Design">
      <div className="absolute bg-black h-[944px] left-0 overflow-clip top-0 w-[1549px]" data-name="App">
        <div className="absolute bg-gradient-to-b content-stretch flex flex-col from-[#14141a] h-[73px] items-start left-0 pb-px pt-[16px] px-[24px] to-[#0b0b0d] top-0 w-[1549px]" data-name="Navigation">
          <div aria-hidden="true" className="absolute border-[0px_0px_1px] border-[rgba(48,48,58,0.2)] border-solid inset-0 pointer-events-none" />
          <div className="h-[40px] relative shrink-0 w-full" data-name="App">
            <div className="absolute h-[40px] left-0 rounded-[16px] top-0 w-[113.016px]" data-name="Button">
              <IconBackgroundImage>
                <path d={svgPaths.p329b1880} id="Vector" stroke="var(--stroke-0, #C4C4CF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
              </IconBackgroundImage>
              <div className="absolute h-[20px] left-[46px] top-[10px] w-[47.016px]" data-name="App">
                <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[20px] left-[24px] not-italic text-[#c4c4cf] text-[14px] text-center text-nowrap top-0 translate-x-[-50%] whitespace-pre">Reflect</p>
              </div>
            </div>
            <div className="absolute h-[40px] left-[121.02px] rounded-[16px] top-0 w-[121.219px]" data-name="Button">
              <IconBackgroundImage>
                <path d={svgPaths.pac54200} id="Vector" stroke="var(--stroke-0, #C4C4CF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                <path d={svgPaths.p254f3200} id="Vector_2" stroke="var(--stroke-0, #C4C4CF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
              </IconBackgroundImage>
              <div className="absolute h-[20px] left-[46px] top-[10px] w-[55.219px]" data-name="App">
                <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[20px] left-[28px] not-italic text-[#c4c4cf] text-[14px] text-center text-nowrap top-0 translate-x-[-50%] whitespace-pre">Threads</p>
              </div>
            </div>
            <div className="absolute h-[40px] left-[250.23px] rounded-[16px] top-0 w-[116.516px]" data-name="Button">
              <div className="absolute bg-[rgba(203,163,93,0.1)] border border-[rgba(203,163,93,0.3)] border-solid h-[40px] left-0 rounded-[16px] top-0 w-[116.516px]" data-name="Container" />
              <BackgroundImage>
                <g clipPath="url(#clip0_23_697)" id="Icon">
                  <path d={svgPaths.p1ab0a010} id="Vector" stroke="var(--stroke-0, #CBA35D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                  <path d={svgPaths.p3eada380} id="Vector_2" stroke="var(--stroke-0, #CBA35D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                  <path d={svgPaths.p3ec38400} id="Vector_3" stroke="var(--stroke-0, #CBA35D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                  <path d={svgPaths.p18fd7b00} id="Vector_4" stroke="var(--stroke-0, #CBA35D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                  <path d="M9 9V6" id="Vector_5" stroke="var(--stroke-0, #CBA35D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                </g>
                <defs>
                  <clipPath id="clip0_23_697">
                    <rect fill="white" height="18" width="18" />
                  </clipPath>
                </defs>
              </BackgroundImage>
              <div className="absolute h-[20px] left-[46px] top-[10px] w-[50.516px]" data-name="App">
                <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[20px] left-[25.5px] not-italic text-[#cba35d] text-[14px] text-center text-nowrap top-0 translate-x-[-50%] whitespace-pre">Identity</p>
              </div>
            </div>
            <div className="absolute h-[40px] left-[374.75px] rounded-[16px] top-0 w-[92.109px]" data-name="Button">
              <IconBackgroundImage>
                <path d={svgPaths.p14dca900} id="Vector" stroke="var(--stroke-0, #C4C4CF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                <path d={svgPaths.p117fc1f0} id="Vector_2" stroke="var(--stroke-0, #C4C4CF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
              </IconBackgroundImage>
              <div className="absolute h-[20px] left-[46px] top-[10px] w-[26.109px]" data-name="App">
                <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[20px] left-[13px] not-italic text-[#c4c4cf] text-[14px] text-center text-nowrap top-0 translate-x-[-50%] whitespace-pre">Self</p>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute content-stretch flex flex-col h-[871px] items-start left-0 overflow-clip top-[73px] w-[1549px]" data-name="Container">
          <div className="bg-black content-stretch flex flex-col h-[944px] items-start overflow-clip relative shrink-0 w-full" data-name="IdentityGraph">
            <div className="h-[149px] relative shrink-0 w-[1549px]" data-name="Header">
              <div aria-hidden="true" className="absolute border-[0px_0px_1px] border-[rgba(48,48,58,0.2)] border-solid inset-0 pointer-events-none" />
              <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pb-px pt-[24px] px-[32px] relative size-full">
                <div className="content-stretch flex h-[100px] items-start justify-between relative shrink-0 w-full" data-name="IdentityGraph">
                  <div className="h-[100px] relative shrink-0 w-[416.422px]" data-name="Container">
                    <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[8px] items-start relative size-full">
                      <div className="h-[72px] relative shrink-0 w-full" data-name="Heading 1">
                        <p className="absolute font-['EB_Garamond:Regular',sans-serif] font-normal leading-[72px] left-0 text-[60px] text-neutral-200 text-nowrap top-0 whitespace-pre">Identity Graph</p>
                      </div>
                      <div className="h-[20px] relative shrink-0 w-full" data-name="Paragraph">
                        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[20px] left-0 not-italic text-[14px] text-[rgba(196,196,207,0.6)] text-nowrap top-0 tracking-[0.14px] whitespace-pre">Your evolving network of beliefs, tensions, and contradictions</p>
                      </div>
                    </div>
                  </div>
                  <div className="h-[38px] relative shrink-0 w-[258.328px]" data-name="Container">
                    <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] items-start relative size-full">
                      <div className="bg-[rgba(203,163,93,0.1)] h-[38px] relative rounded-[16px] shrink-0 w-[74.438px]" data-name="Button">
                        <div aria-hidden="true" className="absolute border border-[rgba(203,163,93,0.5)] border-solid inset-0 pointer-events-none rounded-[16px]" />
                        <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
                          <p className="absolute capitalize font-['Inter:Regular',sans-serif] font-normal leading-[20px] left-[37.5px] not-italic text-[#cba35d] text-[14px] text-center text-nowrap top-[9px] translate-x-[-50%] whitespace-pre">graph</p>
                        </div>
                      </div>
                      <div className="basis-0 grow h-[38px] min-h-px min-w-px relative rounded-[16px] shrink-0" data-name="Button">
                        <div aria-hidden="true" className="absolute border border-[rgba(48,48,58,0.2)] border-solid inset-0 pointer-events-none rounded-[16px]" />
                        <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
                          <p className="absolute capitalize font-['Inter:Regular',sans-serif] font-normal leading-[20px] left-[47.5px] not-italic text-[#c4c4cf] text-[14px] text-center text-nowrap top-[9px] translate-x-[-50%] whitespace-pre">tensions</p>
                        </div>
                      </div>
                      <div className="h-[38px] relative rounded-[16px] shrink-0 w-[74.672px]" data-name="Button">
                        <div aria-hidden="true" className="absolute border border-[rgba(48,48,58,0.2)] border-solid inset-0 pointer-events-none rounded-[16px]" />
                        <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
                          <p className="absolute capitalize font-['Inter:Regular',sans-serif] font-normal leading-[20px] left-[37.5px] not-italic text-[#c4c4cf] text-[14px] text-center text-nowrap top-[9px] translate-x-[-50%] whitespace-pre">loops</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <BackgroundImage1 additionalClassNames="w-[1549px]">
              <div className="absolute h-[795px] left-[1165px] top-0 w-[384px]" data-name="Container">
                <div className="content-stretch flex flex-col gap-[24px] items-start overflow-clip pb-0 pl-[25px] pr-[24px] pt-[24px] relative rounded-[inherit] size-full">
                  <div className="h-[20px] relative shrink-0 w-full" data-name="IdentityGraph">
                    <p className="absolute font-['EB_Garamond:Regular',sans-serif] font-normal leading-[20px] left-0 text-[14px] text-[rgba(203,163,93,0.7)] text-nowrap top-0 tracking-[0.7px] uppercase whitespace-pre">Active Tensions</p>
                  </div>
                  <div className="content-stretch flex flex-col gap-[16px] h-[348px] items-start relative shrink-0 w-full" data-name="IdentityGraph">
                    <ContainerBackgroundImage additionalClassNames="h-[116px]">
                      <div className="content-stretch flex h-[20px] items-start justify-between relative shrink-0 w-full" data-name="IdentityGraph">
                        <HeadingBackgroundImageAndText text="Independence vs Connection" additionalClassNames="w-[156.703px]" />
                        <TextBackgroundImageAndText text="85%" additionalClassNames="w-[26.344px]" />
                      </div>
                      <div className="h-[32px] relative shrink-0 w-full" data-name="IdentityGraph">
                        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[16px] left-0 not-italic text-[12px] text-[rgba(196,196,207,0.6)] top-0 tracking-[0.12px] w-[269px]">Strong pull between self-reliance and need for others</p>
                      </div>
                      <div className="bg-[#0b0b0d] h-[6px] relative rounded-[3.35544e+07px] shrink-0 w-full" data-name="IdentityGraph">
                        <div className="overflow-clip rounded-[inherit] size-full">
                          <div className="content-stretch flex flex-col items-start pl-0 pr-[45.156px] py-0 relative size-full">
                            <div className="bg-gradient-to-r from-[#3a8bff] h-[6px] rounded-[3.35544e+07px] shrink-0 to-[#f06449] via-50% via-[#cba35d] w-full" data-name="Container" />
                          </div>
                        </div>
                      </div>
                    </ContainerBackgroundImage>
                    <ContainerBackgroundImage additionalClassNames="h-[100px]">
                      <div className="content-stretch flex h-[20px] items-start justify-between relative shrink-0 w-full" data-name="IdentityGraph">
                        <HeadingBackgroundImageAndText text="Authenticity vs Protection" additionalClassNames="w-[142.156px]" />
                        <div className="h-[16px] relative shrink-0 w-[25.906px]" data-name="Text">
                          <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
                            <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[16px] left-0 not-italic text-[#cba35d] text-[12px] top-0 w-[26px]">72%</p>
                          </div>
                        </div>
                      </div>
                      <IdentityGraphBackgroundImageAndText text="Wanting to be real while guarding vulnerability" />
                      <div className="bg-[#0b0b0d] h-[6px] relative rounded-[3.35544e+07px] shrink-0 w-full" data-name="IdentityGraph">
                        <div className="overflow-clip rounded-[inherit] size-full">
                          <div className="content-stretch flex flex-col items-start pl-0 pr-[84.281px] py-0 relative size-full">
                            <div className="bg-gradient-to-r from-[#3a8bff] h-[6px] rounded-[3.35544e+07px] shrink-0 to-[#f06449] via-50% via-[#cba35d] w-full" data-name="Container" />
                          </div>
                        </div>
                      </div>
                    </ContainerBackgroundImage>
                    <ContainerBackgroundImage additionalClassNames="h-[100px]">
                      <div className="content-stretch flex h-[20px] items-start justify-between relative shrink-0 w-full" data-name="IdentityGraph">
                        <HeadingBackgroundImageAndText text="Control vs Trust" additionalClassNames="w-[88.625px]" />
                        <TextBackgroundImageAndText text="68%" additionalClassNames="w-[26.672px]" />
                      </div>
                      <IdentityGraphBackgroundImageAndText text="Difficulty releasing control to build genuine trust" />
                      <div className="bg-[#0b0b0d] h-[6px] relative rounded-[3.35544e+07px] shrink-0 w-full" data-name="IdentityGraph">
                        <div className="overflow-clip rounded-[inherit] size-full">
                          <div className="content-stretch flex flex-col items-start pl-0 pr-[96.328px] py-0 relative size-full">
                            <div className="bg-gradient-to-r from-[#3a8bff] h-[6px] rounded-[3.35544e+07px] shrink-0 to-[#f06449] via-50% via-[#cba35d] w-full" data-name="Container" />
                          </div>
                        </div>
                      </div>
                    </ContainerBackgroundImage>
                  </div>
                  <div className="bg-[rgba(174,85,255,0.05)] h-[106px] relative rounded-[14px] shrink-0 w-full" data-name="IdentityGraph">
                    <div aria-hidden="true" className="absolute border border-[rgba(174,85,255,0.2)] border-solid inset-0 pointer-events-none rounded-[14px]" />
                    <div className="size-full">
                      <div className="content-stretch flex flex-col gap-[8px] items-start pb-px pt-[17px] px-[17px] relative size-full">
                        <div className="content-stretch flex h-[16px] items-start relative shrink-0 w-full" data-name="Heading 4">
                          <p className="basis-0 font-['EB_Garamond:Regular',sans-serif] font-normal grow leading-[16px] min-h-px min-w-px relative shrink-0 text-[#ae55ff] text-[12px] tracking-[0.6px] uppercase">Paradox Detection</p>
                        </div>
                        <div className="h-[48px] relative shrink-0 w-full" data-name="Paragraph">
                          <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[16px] left-0 not-italic text-[12px] text-[rgba(196,196,207,0.6)] top-0 tracking-[0.12px] w-[268px]">2 active paradoxes detected in your identity network. These represent simultaneously held contradictory beliefs.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div aria-hidden="true" className="absolute border-[0px_0px_0px_1px] border-[rgba(48,48,58,0.2)] border-solid inset-0 pointer-events-none" />
              </div>
              <div className="absolute content-stretch flex flex-col h-[795px] items-start left-0 overflow-clip top-0 w-[1165px]" data-name="Container">
                <div className="h-[795px] relative shrink-0 w-full" data-name="Canvas">
                  <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-contain pointer-events-none size-full" src="b82edb7453437c4dda4488dac72c22888415def3.png" />
                </div>
              </div>
            </BackgroundImage1>
          </div>
        </div>
      </div>
      <div className="absolute h-[944px] left-0 opacity-[0.177] top-0 w-[1549px]" data-name="App" style={{ backgroundImage: "url('data:image/svg+xml;utf8,<svg viewBox=\\\'0 0 1549 944\\\' xmlns=\\\'http://www.w3.org/2000/svg\\\' preserveAspectRatio=\\\'none\\\'><rect x=\\\'0\\\' y=\\\'0\\\' height=\\\'100%\\\' width=\\\'100%\\\' fill=\\\'url(%23grad)\\\' opacity=\\\'1\\\'/><defs><radialGradient id=\\\'grad\\\' gradientUnits=\\\'userSpaceOnUse\\\' cx=\\\'0\\\' cy=\\\'0\\\' r=\\\'10\\\' gradientTransform=\\\'matrix(0 -122.33 -122.33 0 464.7 377.6)\\\'><stop stop-color=\\\'rgba(203,163,93,0.25)\\\' offset=\\\'0\\\'/><stop stop-color=\\\'rgba(102,82,47,0.125)\\\' offset=\\\'0.3\\\'/><stop stop-color=\\\'rgba(0,0,0,0)\\\' offset=\\\'0.6\\\'/></radialGradient></defs></svg>')" }} />
      <div className="absolute h-[944px] left-0 top-0 w-[1549px]" data-name="App">
        <div className="absolute blur-[140px] filter left-[355.02px] opacity-[0.459] rounded-[3.35544e+07px] size-[448.462px] top-[203.77px]" data-name="Container" style={{ backgroundImage: "url('data:image/svg+xml;utf8,<svg viewBox=\\\'0 0 448.46 448.46\\\' xmlns=\\\'http://www.w3.org/2000/svg\\\' preserveAspectRatio=\\\'none\\\'><rect x=\\\'0\\\' y=\\\'0\\\' height=\\\'100%\\\' width=\\\'100%\\\' fill=\\\'url(%23grad)\\\' opacity=\\\'1\\\'/><defs><radialGradient id=\\\'grad\\\' gradientUnits=\\\'userSpaceOnUse\\\' cx=\\\'0\\\' cy=\\\'0\\\' r=\\\'10\\\' gradientTransform=\\\'matrix(0 -31.711 -31.711 0 224.23 224.23)\\\'><stop stop-color=\\\'rgba(203,163,93,0.5)\\\' offset=\\\'0\\\'/><stop stop-color=\\\'rgba(152,122,70,0.375)\\\' offset=\\\'0.25\\\'/><stop stop-color=\\\'rgba(102,82,47,0.25)\\\' offset=\\\'0.5\\\'/><stop stop-color=\\\'rgba(0,0,0,0)\\\' offset=\\\'1\\\'/></radialGradient></defs></svg>')" }} />
        <div className="absolute blur-[140px] filter left-[736.75px] opacity-[0.328] rounded-[3.35544e+07px] size-[465.995px] top-[283px]" data-name="Container" style={{ backgroundImage: "url('data:image/svg+xml;utf8,<svg viewBox=\\\'0 0 466 466\\\' xmlns=\\\'http://www.w3.org/2000/svg\\\' preserveAspectRatio=\\\'none\\\'><rect x=\\\'0\\\' y=\\\'0\\\' height=\\\'100%\\\' width=\\\'100%\\\' fill=\\\'url(%23grad)\\\' opacity=\\\'1\\\'/><defs><radialGradient id=\\\'grad\\\' gradientUnits=\\\'userSpaceOnUse\\\' cx=\\\'0\\\' cy=\\\'0\\\' r=\\\'10\\\' gradientTransform=\\\'matrix(0 -32.951 -32.951 0 233 233)\\\'><stop stop-color=\\\'rgba(203,163,93,0.25)\\\' offset=\\\'0\\\'/><stop stop-color=\\\'rgba(102,82,47,0.125)\\\' offset=\\\'0.5\\\'/><stop stop-color=\\\'rgba(0,0,0,0)\\\' offset=\\\'1\\\'/></radialGradient></defs></svg>')" }} />
      </div>
      <div className="absolute bg-[rgba(11,11,13,0.8)] content-stretch flex items-start left-[1487px] pb-px pt-[13px] px-[13px] rounded-[16px] size-[46px] top-[16px]" data-name="Button">
        <div aria-hidden="true" className="absolute border border-[rgba(48,48,58,0.3)] border-solid inset-0 pointer-events-none rounded-[16px]" />
        <BackgroundImage1 additionalClassNames="h-[20px]">
          <Icon4VectorBackgroundImage additionalClassNames="bottom-1/2 top-1/2" />
          <Icon4VectorBackgroundImage additionalClassNames="bottom-3/4 top-1/4" />
          <Icon4VectorBackgroundImage additionalClassNames="bottom-1/4 top-3/4" />
        </BackgroundImage1>
      </div>
    </div>
  );
}