import React from 'react';

/**
 * Reveal — a thin marker that tags an element with `data-rise` so the motion
 * engine (useMotionEngine) can choreograph its entrance per scene. It carries
 * no visual state of its own: under reduced-motion the engine never runs and
 * the element simply renders in its final, visible state.
 */
export default function Reveal({ as: Tag = 'div', className = '', children, ...rest }) {
  return (
    <Tag data-rise className={className || undefined} {...rest}>
      {children}
    </Tag>
  );
}
