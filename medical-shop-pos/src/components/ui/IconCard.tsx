import React from 'react';
import { ArrowUp, ArrowDown, LucideIcon } from 'lucide-react';

export function classNames(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(' ');
}

export interface IconCardProps {
    name: string;
    stat: string | number;
    icon: LucideIcon | React.ElementType;
    iconClassName?: string;
    iconBgClassName?: string;
    change?: string | number;
    changeType?: 'increase' | 'decrease' | 'neutral';
    viewAllText?: string;
    onViewAll?: () => void;
    className?: string;
}

export function IconCard({
    name,
    stat,
    icon: Icon,
    iconClassName = "size-6 text-white",
    iconBgClassName = "bg-indigo-500",
    change,
    changeType,
    viewAllText = "View all",
    onViewAll,
    className
}: IconCardProps) {
    return (
        <div
            className={classNames(
                "relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow-sm sm:px-6 sm:py-6 dark:bg-gray-800/75 dark:inset-ring dark:inset-ring-white/10",
                className
            )}
        >
            <dt>
                <div className={classNames("absolute rounded-md p-3", iconBgClassName)}>
                    <Icon aria-hidden="true" className={iconClassName} />
                </div>
                <p className="ml-16 truncate text-sm font-medium text-gray-500 dark:text-gray-400">{name}</p>
            </dt>
            <dd className="ml-16 flex items-baseline">
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stat}</p>

                {change && changeType && changeType !== 'neutral' && (
                    <p
                        className={classNames(
                            changeType === 'increase'
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400',
                            'ml-2 flex items-baseline text-sm font-semibold',
                        )}
                    >
                        {changeType === 'increase' ? (
                            <ArrowUp
                                aria-hidden="true"
                                className="size-5 shrink-0 self-center text-green-500 dark:text-green-400"
                            />
                        ) : (
                            <ArrowDown
                                aria-hidden="true"
                                className="size-5 shrink-0 self-center text-red-500 dark:text-red-400"
                            />
                        )}

                        <span className="sr-only"> {changeType === 'increase' ? 'Increased' : 'Decreased'} by </span>
                        {change}
                    </p>
                )}

                {change && changeType === 'neutral' && (
                    <p className="ml-2 flex items-baseline text-sm font-semibold text-gray-500 dark:text-gray-400">
                        {change}
                    </p>
                )}

                {onViewAll && (
                    <div className="absolute inset-x-0 bottom-0 bg-gray-50 px-4 py-4 sm:px-6 dark:bg-gray-700/20">
                        <div className="text-sm">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    onViewAll();
                                }}
                                className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                            >
                                {viewAllText}<span className="sr-only"> {name} stats</span>
                            </button>
                        </div>
                    </div>
                )}
            </dd>
        </div>
    );
}
