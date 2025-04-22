import * as React from 'react';
import { cn } from '@/lib/utils';

const Textarea = React.forwardRef<
    HTMLTextAreaElement,
    React.ComponentProps<'textarea'>
>(({ className, ...props }, ref) => {
    return (
        <div className="relative group">
            {/* Der Fokusring als Gradient */}
            <div className="pointer-events-none absolute -inset-0.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-400 opacity-0 transition-opacity duration-200 group-focus-within:opacity-100"></div>
            <textarea
                className={cn(
                    'relative flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
                    className,
                )}
                ref={ref}
                {...props}
            />
        </div>
    );
});
Textarea.displayName = 'Textarea';

export { Textarea };
