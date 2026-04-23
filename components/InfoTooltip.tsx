import React from 'react';
import { HelpCircle } from 'lucide-react';

interface InfoTooltipProps {
  text: string;
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({ text }) => (
  <span className="tooltip-container">
    <HelpCircle size={14} className="tooltip-icon" />
    <span className="tooltip-text">{text}</span>
  </span>
);

export default InfoTooltip;
