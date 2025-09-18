"use client";

import { Icon as IconifyIcon, type IconProps } from "@iconify/react";

export const Icon = ({ icon, ...props }: IconProps) => {
  return <IconifyIcon icon={icon} {...props} />;
};
