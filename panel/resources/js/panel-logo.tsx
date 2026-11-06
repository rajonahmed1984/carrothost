import { Package, Server } from 'lucide-react';
import { basePath } from './api';

/** The control panel a hosting module runs, by product module. */
export const panelName = (module: string | null) => (module === 'cpanel' ? 'cPanel' : module === 'webuzo' ? 'Webuzo' : 'Control Panel');

/** The cPanel "cP" mark, from the cPanel wordmark in simple-icons. */
const CPANEL_MARK = 'M1.984 10.653a1.924 1.924 0 00-.638.107 1.989 1.989 0 00-.553.295 1.962 1.962 0 00-.7 1.045l-.027.1a1.936 1.936 0 00-.023.905 1.955 1.955 0 00.361.786 1.986 1.986 0 00.668.554 1.875 1.875 0 00.88.21h.464l.266-.983a.23.23 0 00-.043-.215.239.239 0 00-.198-.096h-.423a.702.702 0 01-.319-.074.67.67 0 01-.24-.195.732.732 0 01-.127-.281.706.706 0 01.01-.34.73.73 0 01.256-.377.675.675 0 01.42-.14h.697a.538.538 0 00.338-.114.561.561 0 00.199-.297l.232-.89h-1.5zM4.586 9.346a.538.538 0 00-.34.113.561.561 0 00-.197.299L2.74 14.654h.922a.528.528 0 00.332-.113.561.561 0 00.2-.291l.968-3.604h.744a.677.677 0 01.317.077.703.703 0 01.24.199.732.732 0 01.129.281.65.65 0 01-.01.326.698.698 0 01-.676.526h-.385a.538.538 0 00-.337.113.561.561 0 00-.2.291l-.24.896h1.201a1.939 1.939 0 001.62-.867 1.988 1.988 0 00.265-.586l.027-.1a1.854 1.854 0 00.026-.907 1.973 1.973 0 00-1.031-1.34 1.875 1.875 0 00-.88-.21H4.587z';

const sizes = { sm: 'h-10 w-10 rounded-xl', md: 'h-12 w-12 rounded-xl', lg: 'h-16 w-16 rounded-2xl sm:h-20 sm:w-20' };

/** The provider's logo in a soft tile: cPanel, Webuzo, or a plain icon for anything else. */
export function PanelLogo({ module, type, size = 'sm' }: { module: string | null; type?: string; size?: keyof typeof sizes }) {
    const box = `flex shrink-0 items-center justify-center ${sizes[size]}`;

    if (module === 'cpanel') {
        return (
            <span className={`${box} bg-orange-50 ring-1 ring-orange-100`} title="cPanel">
                <svg viewBox="0 8 8 8" className="h-[62%] w-[62%]" role="img" aria-label="cPanel"><path fill="#FF6C2C" d={CPANEL_MARK} /></svg>
            </span>
        );
    }

    if (module === 'webuzo') {
        return (
            <span className={`${box} bg-sky-50 ring-1 ring-sky-100`} title="Webuzo">
                <img src={`${basePath}/images/panels/webuzo.png`} alt="Webuzo" className="h-[62%] w-[62%] object-contain" />
            </span>
        );
    }

    return <span className={`${box} bg-slate-100 text-slate-600`}>{type === 'vps' ? <Server size={size === 'sm' ? 18 : 24} /> : <Package size={size === 'sm' ? 18 : 24} />}</span>;
}
