import React, { useState, useEffect } from 'react';
import { AppSettings, ModelProvider, DEFAULT_SETTINGS } from '../types';
import { XIcon } from './Icons';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

export const SettingsModal: React.FC<Props> = ({ isOpen, onClose, settings, onSave }) => {
  const [tempSettings, setTempSettings] = useState<AppSettings>(settings);

  useEffect(() => {
    setTempSettings(settings);
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleChange = (key: keyof AppSettings, value: any) => {
    setTempSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave(tempSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#202123] w-full max-w-lg rounded-lg shadow-2xl border border-zinc-700 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-zinc-700">
          <h2 className="text-lg font-semibold text-zinc-100">Configuration</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* User Name */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">User Name</label>
            <input 
              type="text" 
              value={tempSettings.userName}
              onChange={(e) => handleChange('userName', e.target.value)}
              className="w-full bg-[#343541] border border-zinc-600 rounded p-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Model Provider */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Model Provider</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.values(ModelProvider).map((provider) => (
                <button
                  key={provider}
                  onClick={() => handleChange('provider', provider)}
                  className={`p-2 rounded text-sm border ${
                    tempSettings.provider === provider 
                    ? 'bg-indigo-600 border-indigo-600 text-white' 
                    : 'bg-[#343541] border-zinc-600 text-zinc-300 hover:bg-[#40414f]'
                  }`}
                >
                  {provider}
                </button>
              ))}
            </div>
          </div>

          {/* Model Name */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Model Name</label>
            {tempSettings.provider === ModelProvider.GEMINI ? (
                <select 
                    value={tempSettings.modelName}
                    onChange={(e) => handleChange('modelName', e.target.value)}
                    className="w-full bg-[#343541] border border-zinc-600 rounded p-2 text-white focus:outline-none focus:border-indigo-500"
                >
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fast)</option>
                    <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</option>
                    <option value="gemini-3-pro-preview">Gemini 3 Pro Preview (Smart)</option>
                    <option value="gemini-2.5-flash-thinking">Gemini 2.5 Flash Thinking</option>
                </select>
            ) : (
                <input 
                    type="text"
                    value={tempSettings.modelName}
                    onChange={(e) => handleChange('modelName', e.target.value)}
                    placeholder="e.g. gpt-4"
                    className="w-full bg-[#343541] border border-zinc-600 rounded p-2 text-white focus:outline-none focus:border-indigo-500"
                />
            )}
            <p className="text-xs text-zinc-500 mt-1">Select or type the specific model ID.</p>
          </div>

          {/* System Instruction */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">System Instruction</label>
            <textarea 
              value={tempSettings.systemInstruction}
              onChange={(e) => handleChange('systemInstruction', e.target.value)}
              rows={3}
              className="w-full bg-[#343541] border border-zinc-600 rounded p-2 text-white focus:outline-none focus:border-indigo-500 text-sm"
            />
            <p className="text-xs text-zinc-500 mt-1">Defines how the AI behaves.</p>
          </div>

          {/* Temperature */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
                Temperature ({tempSettings.temperature})
            </label>
            <input 
              type="range" 
              min="0" 
              max="2" 
              step="0.1"
              value={tempSettings.temperature}
              onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
              className="w-full accent-indigo-500 h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-zinc-500 mt-1">
                <span>Precise</span>
                <span>Creative</span>
            </div>
          </div>

           {/* API Key Info */}
           <div className="p-3 bg-yellow-900/20 border border-yellow-700/30 rounded text-xs text-yellow-500">
              <strong>Note:</strong> Gemini API Key is loaded securely from the environment for this session. Other providers require backend configuration not available in this demo.
           </div>

        </div>

        <div className="p-4 border-t border-zinc-700 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded transition-colors"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};