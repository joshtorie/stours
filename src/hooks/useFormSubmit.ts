import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface UseFormSubmitOptions {
  table: string;
  initialData: Record<string, any>;
}

export function useFormSubmit<T extends Record<string, any>>({ table, initialData }: UseFormSubmitOptions) {
  const [formData, setFormData] = useState<T>(initialData as T);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent, customData?: T) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { error } = await supabase
        .from(table)
        .insert([customData || formData]);

      if (error) throw error;

      setSuccess(true);
      setFormData(initialData as T);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value;
    setFormData(prev => ({
      ...prev,
      [e.target.name]: value
    }));
  };

  return {
    formData,
    loading,
    error,
    success,
    handleSubmit,
    handleChange
  };
}