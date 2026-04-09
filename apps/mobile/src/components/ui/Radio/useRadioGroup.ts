import { useState, useCallback } from 'react';

interface UseRadioGroupOptions {
    defaultValue?: string | null;
    onChange?: (value: string) => void;
}

export function useRadioGroup({ defaultValue = null, onChange }: UseRadioGroupOptions = {}) {
    const [selected, setSelected] = useState<string | null>(defaultValue);

    const handleSelect = useCallback(
        (value: string) => {
        setSelected(value);
        onChange?.(value);
        },
        [onChange]
    );

    return {
        selected,
        handleSelect,
    };
}
