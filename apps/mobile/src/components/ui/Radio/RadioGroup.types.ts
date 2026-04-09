import { ComponentType, ReactNode } from 'react';
import type { IconProps } from 'iconsax-react-nativejs';

export interface RadioOption {
    value: string;
    label: string;
    description?: string;
    icon?: ComponentType<IconProps>;
    disabled?: boolean;
}

export interface RadioItemProps {
    option: RadioOption;
    selected: boolean;
    onSelect: (value: string) => void;
}

export interface RadioGroupProps {
    options: RadioOption[];
    value: string | null;
    onChange: (value: string) => void;
    ItemComponent: ComponentType<RadioItemProps>;
    label?: string;
    disabled?: boolean;
}
