import React, { useState, useCallback } from 'react';
import { Eye, Palette, Settings, BarChart3, AlertTriangle, CheckCircle, Copy, Download, Info } from 'lucide-react';
import { processColorBlindnessSimulator, type ColorBlindnessSimulatorConfig } from '../../../tools/color/color-blindness-simulator';

const ColorBlindnessSimulator: React.FC = () => {
  const [input, setInput] = useState('#FF0000 #00FF00 #0000FF #FFFF00 #FF00FF #00FFFF');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'simulate' | 'analysis' | 'report'>('simulate');
  const [config, setConfig] = useState<ColorBlindnessSimulatorConfig>({
    colorBlindnessType: 'deuteranopia',
    severity: 100,
    inputType: 'color-palette',
    outputFormat: 'hex',
    includeOriginal: true,
    generateReport: true,
    testPatterns: false,
    accessibilityCheck: true,
    contrastRatios: true,
    recommendAlternatives: true
  });

  const colorBlindnessTypes = [
    { value: 'protanopia', label: 'Protanopia', description: 'Red-blind (missing L-cones)' },
    { value: 'deuteranopia', label: 'Deuteranopia', description: 'Green-blind (missing M-cones)' },
    { value: 'tritanopia', label: 'Tritanopia', description: 'Blue-blind (missing S-cones)' },
    { value: 'protanomaly', label: 'Protanomaly', description: 'Red-weak (reduced L-cones)' },
    { value: 'deuteranomaly', label: 'Deuteranomaly', description: 'Green-weak (reduced M-cones)' },
    { value: 'tritanomaly', label: 'Tritanomaly', description: 'Blue-weak (reduced S-cones)' },
    { value: 'achromatopsia', label: 'Achromatopsia', description: 'Complete color blindness' },
    { value: 'achromatomaly', label: 'Achromatomaly', description: 'Partial color blindness' }
  ];

  const simulateColors = useCallback(async () => {
    if (!input.trim()) return;
    
    setLoading(true);
    try {
      const simulationResult = await processColorBlindnessSimulator(input, config);
      setResult(simulationResult);
    } catch (error) {
      setResult({
        data: null,
        error: error instanceof Error ? error.message : 'Simulation failed'
      });
    } finally {
      setLoading(false);
    }
  }, [input, config]);

  // Auto-simulate when config or input changes
  React.useEffect(() => {
    const debounceTimer = setTimeout(() => {
      simulateColors();
    }, 500);
    
    return () => clearTimeout(debounceTimer);
  }, [simulateColors]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  };

  const downloadReport = () => {
    if (!result?.data) return;
    
    let reportContent = `Color Blindness Simulation Report\n`;
    reportContent += `Type: ${config.colorBlindnessType}\n`;
    reportContent += `Severity: ${config.severity}%\n\n`;
    
    reportContent += `Original Colors:\n`;
    result.data.originalColors.forEach((color: string) => {
      reportContent += `${color}\n`;
    });
    
    reportContent += `\nSimulated Colors:\n`;
    result.data.simulatedColors[config.colorBlindnessType]?.forEach((color: string, index: number) => {
      reportContent += `${result.data.originalColors[index]} → ${color}\n`;
    });
    
    if (result.data.accessibilityReport) {
      reportContent += `\nAccessibility Score: ${result.data.accessibilityReport.overallScore}/100\n`;
      reportContent += `\nRecommendations:\n`;
      result.data.accessibilityReport.recommendations.forEach((rec: string) => {
        reportContent += `• ${rec}\n`;
      });
    }
    
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `color-blindness-report-${config.colorBlindnessType}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getPresetColors = (preset: string) => {
    const presets: Record<string, string> = {
      'traffic-lights': '#FF0000 #FFFF00 #00FF00',
      'website-palette': '#2563EB #DC2626 #059669 #D97706 #7C3AED #F59E0B',
      'rainbow': '#FF0000 #FF8000 #FFFF00 #80FF00 #00FF00 #00FF80 #00FFFF #0080FF #0000FF #8000FF #FF00FF #FF0080',
      'accessible': '#003f5c #2f4b7c #665191 #a05195 #d45087 #f95d6a #ff7c43 #ffa600'
    };
    
    setInput(presets[preset] || '');
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <div >
            <Eye  />
          </div>
          <h1 >
            Color Blindness Simulator
          </h1>
        </div>
        <p >
          Simulate how colors appear to people with different types of color vision deficiencies
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Input Panel */}
        <div className="xl:col-span-1">
          <div >
            <div >
              <h2 >
                <Palette className="w-5 h-5" />
                Input Colors
              </h2>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Input Type */}
              <div>
                <label >
                  Input Type
                </label>
                <select
                  value={config.inputType}
                  onChange={(e) => setConfig({...config, inputType: e.target.value as any})}
                  
                >
                  <option value="single-color">Single Color</option>
                  <option value="color-palette">Color Palette</option>
                  <option value="css-colors">CSS Colors</option>
                </select>
              </div>

              {/* Color Input */}
              <div>
                <label >
                  Colors
                </label>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    config.inputType === 'single-color' 
                      ? '#FF0000' 
                      : config.inputType === 'css-colors'
                      ? '.primary { color: #3B82F6; }'
                      : '#FF0000 #00FF00 #0000FF'
                  }
                  
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {config.inputType === 'single-color' && 'Enter a hex color (e.g., #FF0000)'}
                  {config.inputType === 'color-palette' && 'Enter hex colors separated by spaces'}
                  {config.inputType === 'css-colors' && 'Paste CSS code with color values'}
                </p>
              </div>

              {/* Presets */}
              <div>
                <label >
                  Quick Presets
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => getPresetColors('traffic-lights')}
                    
                  >
                    Traffic Lights
                  </button>
                  <button
                    onClick={() => getPresetColors('website-palette')}
                    
                  >
                    Website
                  </button>
                  <button
                    onClick={() => getPresetColors('rainbow')}
                    
                  >
                    Rainbow
                  </button>
                  <button
                    onClick={() => getPresetColors('accessible')}
                    
                  >
                    Accessible
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Configuration Panel */}
          <div >
            <div >
              <h2 >
                <Settings className="w-5 h-5" />
                Configuration
              </h2>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Color Blindness Type */}
              <div>
                <label >
                  Color Vision Deficiency
                </label>
                <select
                  value={config.colorBlindnessType}
                  onChange={(e) => setConfig({...config, colorBlindnessType: e.target.value as any})}
                  
                >
                  {colorBlindnessTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {colorBlindnessTypes.find(t => t.value === config.colorBlindnessType)?.description}
                </p>
              </div>

              {/* Severity (for partial deficiencies) */}
              {config.colorBlindnessType.includes('anomaly') && (
                <div>
                  <label >
                    Severity: {config.severity}%
                  </label>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    value={config.severity}
                    onChange={(e) => setConfig({...config, severity: parseInt(e.target.value)})}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Mild</span>
                    <span>Severe</span>
                  </div>
                </div>
              )}

              {/* Options */}
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.generateReport}
                    onChange={(e) => setConfig({...config, generateReport: e.target.checked})}
                    className="rounded border-gray-300 text-purple-600"
                  />
                  <span >
                    Generate Accessibility Report
                  </span>
                </label>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.accessibilityCheck}
                    onChange={(e) => setConfig({...config, accessibilityCheck: e.target.checked})}
                    className="rounded border-gray-300 text-purple-600"
                  />
                  <span >
                    Check Accessibility Issues
                  </span>
                </label>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.contrastRatios}
                    onChange={(e) => setConfig({...config, contrastRatios: e.target.checked})}
                    className="rounded border-gray-300 text-purple-600"
                  />
                  <span >
                    Calculate Contrast Ratios
                  </span>
                </label>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.recommendAlternatives}
                    onChange={(e) => setConfig({...config, recommendAlternatives: e.target.checked})}
                    className="rounded border-gray-300 text-purple-600"
                  />
                  <span >
                    Recommend Alternative Colors
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="xl:col-span-3">
          <div >
            {/* Tabs */}
            <div >
              <nav className="flex">
                <button
                  onClick={() => setActiveTab('simulate')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 ${
                    activeTab === 'simulate'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Eye className="w-4 h-4 mr-2 inline" />
                  Color Simulation
                </button>
                <button
                  onClick={() => setActiveTab('analysis')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 ${
                    activeTab === 'analysis'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 mr-2 inline" />
                  Analysis
                </button>
                <button
                  onClick={() => setActiveTab('report')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 ${
                    activeTab === 'report'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Info className="w-4 h-4 mr-2 inline" />
                  Report
                </button>
              </nav>
            </div>

            <div className="p-6">
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {result?.error && (
                <div >
                  <p >{result.error}</p>
                </div>
              )}

              {activeTab === 'simulate' && result?.data && !loading && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 >
                      Color Simulation: {colorBlindnessTypes.find(t => t.value === config.colorBlindnessType)?.label}
                    </h3>
                    <button
                      onClick={() => copyToClipboard(result.data.simulatedColors[config.colorBlindnessType]?.join(' ') || '')}
                      
                    >
                      <Copy className="w-4 h-4" />
                      Copy Simulated Colors
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Original Colors */}
                    <div>
                      <h4 >Original Colors</h4>
                      <div className="space-y-2">
                        {result.data.originalColors.map((color: string, index: number) => (
                          <div key={`original-${index}`} className="flex items-center gap-3">
                            <div
                              
                              style={{ backgroundColor: color }}
                            />
                            <div className="flex-1">
                              <div >
                                {color}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Simulated Colors */}
                    <div>
                      <h4 >
                        Simulated Colors ({config.colorBlindnessType})
                      </h4>
                      <div className="space-y-2">
                        {result.data.simulatedColors[config.colorBlindnessType]?.map((color: string, index: number) => (
                          <div key={`simulated-${index}`} className="flex items-center gap-3">
                            <div
                              
                              style={{ backgroundColor: color }}
                            />
                            <div className="flex-1">
                              <div >
                                {color}
                              </div>
                              {result.data.originalColors[index] !== color && (
                                <div >
                                  Changed from {result.data.originalColors[index]}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'analysis' && result?.data && !loading && (
                <div className="space-y-6">
                  <h3 >Color Analysis</h3>

                  {/* Color Classification */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Problematic Colors */}
                    <div >
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle  />
                        <h4 >
                          Problematic Colors ({result.data.colorAnalysis.problematicColors.length})
                        </h4>
                      </div>
                      <div className="space-y-2">
                        {result.data.colorAnalysis.problematicColors.length === 0 ? (
                          <p >No problematic colors found!</p>
                        ) : (
                          result.data.colorAnalysis.problematicColors.map((color: string, index: number) => (
                            <div key={index} className="flex items-center gap-2">
                              <div
                                className="w-6 h-6 rounded border border-red-300"
                                style={{ backgroundColor: color }}
                              />
                              <span >{color}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Safe Colors */}
                    <div >
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle  />
                        <h4 >
                          Safe Colors ({result.data.colorAnalysis.safeColors.length})
                        </h4>
                      </div>
                      <div className="space-y-2">
                        {result.data.colorAnalysis.safeColors.map((color: string, index: number) => (
                          <div key={index} className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded border border-green-300"
                              style={{ backgroundColor: color }}
                            />
                            <span >{color}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Contrast Issues */}
                  {result.data.colorAnalysis.contrastIssues.length > 0 && (
                    <div>
                      <h4 >Contrast Analysis</h4>
                      <div className="overflow-x-auto">
                        <table >
                          <thead >
                            <tr>
                              <th >Color Pair</th>
                              <th >Original</th>
                              <th >Simulated</th>
                              <th >WCAG</th>
                            </tr>
                          </thead>
                          <tbody >
                            {result.data.colorAnalysis.contrastIssues.map((issue: any, index: number) => (
                              <tr key={index} >
                                <td className="px-4 py-2">
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-4 h-4 rounded border"
                                      style={{ backgroundColor: issue.color1 }}
                                    />
                                    <div
                                      className="w-4 h-4 rounded border"
                                      style={{ backgroundColor: issue.color2 }}
                                    />
                                  </div>
                                </td>
                                <td >
                                  {issue.originalContrast}:1
                                </td>
                                <td >
                                  {issue.simulatedContrast}:1
                                </td>
                                <td className="px-4 py-2">
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    issue.wcagLevel === 'AAA' ? 'bg-green-100 text-green-800' :
                                    issue.wcagLevel === 'AA' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {issue.wcagLevel}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'report' && result?.data?.accessibilityReport && !loading && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 >Accessibility Report</h3>
                    <button
                      onClick={downloadReport}
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded flex items-center gap-2 text-sm"
                    >
                      <Download className="w-4 h-4" />
                      Download Report
                    </button>
                  </div>

                  {/* Overall Score */}
                  <div >
                    <div className="text-center">
                      <div >
                        {result.data.accessibilityReport.overallScore}/100
                      </div>
                      <div >
                        Accessibility Score
                      </div>
                      <div >
                        <div
                          className="bg-purple-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${result.data.accessibilityReport.overallScore}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div>
                    <h4 >Recommendations</h4>
                    <div className="space-y-3">
                      {result.data.accessibilityReport.recommendations.map((rec: string, index: number) => (
                        <div key={index} >
                          <Info  />
                          <p >{rec}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Alternative Colors */}
                  {Object.keys(result.data.accessibilityReport.alternativeColors).length > 0 && (
                    <div>
                      <h4 >Suggested Alternative Colors</h4>
                      <div className="space-y-3">
                        {Object.entries(result.data.accessibilityReport.alternativeColors).map(([original, alternative], index) => (
                          <div key={index} >
                            <div className="flex items-center gap-2">
                              <div
                                className="w-8 h-8 rounded border border-gray-300"
                                style={{ backgroundColor: original }}
                              />
                              <span >{original}</span>
                            </div>
                            <div className="text-gray-500">→</div>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-8 h-8 rounded border border-gray-300"
                                style={{ backgroundColor: alternative }}
                              />
                              <span >{alternative}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!result && !loading && (
                <div className="text-center py-12">
                  <Eye className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p >
                    Enter colors above to simulate color blindness
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info Panel */}
      <div >
        <div className="flex items-start gap-3">
          <Info  />
          <div>
            <h3 >
              Understanding Color Vision Deficiencies
            </h3>
            <div >
              <p>• <strong>Protanopia/Protanomaly:</strong> Difficulty distinguishing red colors (~1% of men)</p>
              <p>• <strong>Deuteranopia/Deuteranomaly:</strong> Difficulty distinguishing green colors (~1% of men)</p>
              <p>• <strong>Tritanopia/Tritanomaly:</strong> Difficulty distinguishing blue colors (very rare)</p>
              <p>• <strong>Achromatopsia:</strong> Complete color blindness (extremely rare)</p>
              <p>• <strong>WCAG Guidelines:</strong> 4.5:1 contrast ratio minimum for accessibility compliance</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorBlindnessSimulator;