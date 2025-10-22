/**
 * Portal Component
 * 
 * Renders children into a DOM node that exists outside the parent component's DOM hierarchy.
 * Useful for modals, tooltips, and other overlay components.
 */

import { useEffect, useState, ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
  children: ReactNode;
  containerId?: string;
}

export function Portal({ children, containerId = 'modal-root' }: PortalProps) {
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    let element = document.getElementById(containerId);
    
    // Create the container if it doesn't exist
    if (!element) {
      element = document.createElement('div');
      element.id = containerId;
      document.body.appendChild(element);
    }
    
    setContainer(element);

    return () => {
      // Clean up only if we created the element
      if (element && element.childNodes.length === 0 && element.id !== 'modal-root') {
        element.remove();
      }
    };
  }, [containerId]);

  if (!container) return null;

  return createPortal(children, container);
}
