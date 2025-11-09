export function cn(...args) {
  return args.filter(Boolean).join(' ');
}

export default { cn };
