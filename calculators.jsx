// ==================== CALCULATOR COMPONENTS ====================
// Phase 3: React Calculator Components with EXACT Formula Preservation

/**
 * TriggeredTaskCalculator - Calculator for triggered tasks
 * Preserves exact formulas from original (lines 497-499 in backup)
 */
function TriggeredTaskCalculator() {
    const { passwordUnlocked } = useApp();
    const { setTriggeredResult } = useCalculator();

    const [formData, setFormData] = useState({
        apiPerDay: CALCULATOR_CONSTANTS.TRIGGERED_TASK.DEFAULT_API_PER_DAY,
        coverageHours: CALCULATOR_CONSTANTS.TRIGGERED_TASK.DEFAULT_COVERAGE_HOURS,
        apiResponseTime: CALCULATOR_CONSTANTS.TRIGGERED_TASK.DEFAULT_RESPONSE_TIME,
        peak: CALCULATOR_CONSTANTS.TRIGGERED_TASK.DEFAULT_PEAK
    });
    const [result, setResult] = useState(null);

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const calculate = () => {
        // CRITICAL: Preserve exact formula from original (lines 497-499)
        const concurrentAPI = formData.apiPerDay / formData.coverageHours / 60 / 60 * (formData.peak / 100);
        const nodesRequired = concurrentAPI / (20 / formData.apiResponseTime);
        const haNodesRequired = Math.ceil(Math.max(nodesRequired * 1.3, 2));

        const calculatedResult = {
            concurrentAPI,
            nodesRequired,
            haNodesRequired
        };

        setResult(calculatedResult);
        setTriggeredResult(calculatedResult);
    };

    return (
        <>
            <form onSubmit={(e) => e.preventDefault()}>
                <FormField
                    id="api-per-day"
                    label="API requests per Day"
                    value={formData.apiPerDay}
                    onChange={(value) => updateField('apiPerDay', value)}
                />

                <FormField
                    id="coverage-hours"
                    label="API Usage Hours per Day"
                    value={formData.coverageHours}
                    onChange={(value) => updateField('coverageHours', value)}
                />

                <FormField
                    id="api-response-time"
                    label="API Response Time (seconds)"
                    value={formData.apiResponseTime}
                    onChange={(value) => updateField('apiResponseTime', value)}
                    visible={passwordUnlocked}
                />

                <FormField
                    id="peak"
                    label="Peak (%)"
                    value={formData.peak}
                    onChange={(value) => updateField('peak', value)}
                />

                <Button onClick={calculate}>Calculate</Button>
            </form>

            {result && <ResultDisplay results={result} type="triggered" />}
        </>
    );
}

/**
 * UltraTaskCalculator - Calculator for ultra tasks
 * Preserves exact formulas from original (lines 528-532 in backup)
 */
function UltraTaskCalculator() {
    const { passwordUnlocked } = useApp();
    const { setUltraResult } = useCalculator();

    const [formData, setFormData] = useState({
        apiPerDay: CALCULATOR_CONSTANTS.ULTRA_TASK.DEFAULT_API_PER_DAY,
        coverageHours: CALCULATOR_CONSTANTS.ULTRA_TASK.DEFAULT_COVERAGE_HOURS,
        apiResponseTime: CALCULATOR_CONSTANTS.ULTRA_TASK.DEFAULT_RESPONSE_TIME,
        peak: CALCULATOR_CONSTANTS.ULTRA_TASK.DEFAULT_PEAK
    });
    const [result, setResult] = useState(null);

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const calculate = () => {
        // CRITICAL: Preserve exact formula from original (lines 528-532)
        const concurrentAPI = formData.apiPerDay / formData.coverageHours / 60 / 60 * (formData.peak / 100);
        const executionNodesRequired = concurrentAPI / (100 / formData.apiResponseTime);
        const haExecutionNodesRequired = Math.max(Math.ceil(executionNodesRequired * 1.3), 2);
        const fmNodesRequired = concurrentAPI / (200 / formData.apiResponseTime);
        const haFmNodesRequired = Math.max(Math.ceil(fmNodesRequired * 1.3), 2);

        const calculatedResult = {
            concurrentAPI,
            executionNodesRequired,
            haExecutionNodesRequired,
            fmNodesRequired,
            haFmNodesRequired
        };

        setResult(calculatedResult);
        setUltraResult(calculatedResult);
    };

    return (
        <>
            <form onSubmit={(e) => e.preventDefault()}>
                <FormField
                    id="api-per-day-ultra"
                    label="API requests per Day"
                    value={formData.apiPerDay}
                    onChange={(value) => updateField('apiPerDay', value)}
                />

                <FormField
                    id="coverage-hours-ultra"
                    label="API Usage Hours per Day"
                    value={formData.coverageHours}
                    onChange={(value) => updateField('coverageHours', value)}
                />

                <FormField
                    id="api-response-time-ultra"
                    label="API Response Time (seconds)"
                    value={formData.apiResponseTime}
                    onChange={(value) => updateField('apiResponseTime', value)}
                    visible={passwordUnlocked}
                />

                <FormField
                    id="peak-ultra"
                    label="Peak (%)"
                    value={formData.peak}
                    onChange={(value) => updateField('peak', value)}
                />

                <Button onClick={calculate}>Calculate</Button>
            </form>

            {result && <ResultDisplay results={result} type="ultra" />}
        </>
    );
}

/**
 * ScheduledTaskCalculator - Calculator for scheduled tasks
 * Preserves exact formulas from original (lines 643-645 in backup)
 */
function ScheduledTaskCalculator() {
    const { passwordUnlocked } = useApp();
    const { setScheduledResult } = useCalculator();

    const [formData, setFormData] = useState({
        batchSize: CALCULATOR_CONSTANTS.SCHEDULED_TASK.DEFAULT_BATCH_SIZE_GB,
        processTime: CALCULATOR_CONSTANTS.SCHEDULED_TASK.DEFAULT_PROCESS_TIME,
        complexityMultiplier: CALCULATOR_CONSTANTS.SCHEDULED_TASK.DEFAULT_COMPLEXITY
    });
    const [isBatchSize, setIsBatchSize] = useState(true); // true = GB, false = Rows
    const [result, setResult] = useState(null);

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleToggleBatchMode = (checked) => {
        setIsBatchSize(!checked);
        if (!checked) {
            // Switching to GB mode
            setFormData(prev => ({
                ...prev,
                batchSize: CALCULATOR_CONSTANTS.SCHEDULED_TASK.DEFAULT_BATCH_SIZE_GB
            }));
        } else {
            // Switching to Rows mode
            setFormData(prev => ({
                ...prev,
                batchSize: CALCULATOR_CONSTANTS.SCHEDULED_TASK.DEFAULT_BATCH_SIZE_ROWS
            }));
        }
    };

    const calculate = () => {
        let batchSizeGB;
        if (isBatchSize) {
            batchSizeGB = formData.batchSize; // In GB
        } else {
            // Convert rows to GB
            batchSizeGB = formData.batchSize * CALCULATOR_CONSTANTS.SCHEDULED_TASK.BYTES_PER_ROW / 10000000000;
        }

        // CRITICAL: Preserve exact formula from original (lines 643-645)
        const mbPerMinute = (batchSizeGB * 1024) / (formData.processTime * 60);
        const nodesRequired = mbPerMinute * formData.complexityMultiplier / 300;
        const haNodesRequired = Math.ceil(Math.max(nodesRequired * 1.3, 2));

        const calculatedResult = {
            mbPerMinute,
            nodesRequired,
            haNodesRequired
        };

        setResult(calculatedResult);
        setScheduledResult(calculatedResult);
    };

    const complexityOptions = [
        { value: 1, label: 'straight pass through' },
        { value: 1.25, label: 'few sorts/aggregations' },
        { value: 1.5, label: 'moderate sorts/aggregations' },
        { value: 2, label: 'many sorts/aggregations' }
    ];

    return (
        <>
            <form onSubmit={(e) => e.preventDefault()}>
                <FormField
                    id="batch-size"
                    label={isBatchSize ? "Batch size (GB)" : "Batch volume (Rows)"}
                    value={formData.batchSize}
                    onChange={(value) => updateField('batchSize', value)}
                />

                <Toggle
                    id="toggle-batch-mode"
                    label="Toggle to Batch volume (Rows)"
                    checked={!isBatchSize}
                    onChange={handleToggleBatchMode}
                />

                <FormField
                    id="process-time"
                    label="Available Batch Window (hours)"
                    value={formData.processTime}
                    onChange={(value) => updateField('processTime', value)}
                />

                <FormField
                    id="complexity-multiplier"
                    label="Transformation Complexity"
                    type="select"
                    value={formData.complexityMultiplier}
                    onChange={(value) => updateField('complexityMultiplier', parseFloat(value))}
                    options={complexityOptions}
                    visible={passwordUnlocked}
                />

                <Button onClick={calculate}>Calculate</Button>
            </form>

            {result && <ResultDisplay results={result} type="scheduled" />}
        </>
    );
}

/**
 * HeadlessUltraCalculator - Calculator for headless ultra tasks
 * Preserves exact formulas from original (lines 558-587 in backup)
 */
function HeadlessUltraCalculator() {
    const { passwordUnlocked } = useApp();
    const { setHeadlessUltraResult } = useCalculator();

    const [formData, setFormData] = useState({
        eventPerDay: CALCULATOR_CONSTANTS.HEADLESS_ULTRA.DEFAULT_EVENT_PER_DAY,
        coverageHours: CALCULATOR_CONSTANTS.HEADLESS_ULTRA.DEFAULT_COVERAGE_HOURS,
        eventResponseTime: CALCULATOR_CONSTANTS.HEADLESS_ULTRA.DEFAULT_RESPONSE_TIME,
        eventSize: CALCULATOR_CONSTANTS.HEADLESS_ULTRA.DEFAULT_EVENT_SIZE,
        peak: CALCULATOR_CONSTANTS.HEADLESS_ULTRA.DEFAULT_PEAK
    });
    const [isMicrobatching, setIsMicrobatching] = useState(true);
    const [result, setResult] = useState(null);

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleToggleMicrobatching = (checked) => {
        setIsMicrobatching(checked);
    };

    const calculate = () => {
        const complexityMultiplier = 1; // Hard coded for now

        if (isMicrobatching) {
            // CRITICAL: Preserve exact formula from original (lines 558-560)
            const concurrentEvent = formData.eventPerDay / formData.coverageHours / 60 / 60 * (formData.peak / 100);
            const executionNodesRequired = concurrentEvent / (100 / formData.eventResponseTime);
            const haExecutionNodesRequired = Math.max(Math.ceil(executionNodesRequired * 1.3), 2);

            const calculatedResult = {
                isMicrobatching: true,
                eventPerSecond: concurrentEvent,
                executionNodesRequired,
                haExecutionNodesRequired
            };

            setResult(calculatedResult);
            setHeadlessUltraResult(calculatedResult);
        } else {
            // CRITICAL: Preserve exact formula from original (lines 571-577)
            const batchSize = (formData.eventSize * formData.eventPerDay) / 10000000000; // Convert events to GB
            const concurrentEvent = formData.eventPerDay / formData.coverageHours / 60 * (formData.peak / 100);
            const mbPerMinute = ((batchSize * 1024) / (formData.coverageHours * 60)) * (formData.peak / 100);
            const executionNodesRequired = mbPerMinute * complexityMultiplier / 150; // Half the throughput of scheduled tasks
            const haExecutionNodesRequired = Math.ceil(Math.max(executionNodesRequired * 1.3, 2));

            const calculatedResult = {
                isMicrobatching: false,
                eventPerMinute: concurrentEvent,
                mbPerMinute,
                executionNodesRequired,
                haExecutionNodesRequired
            };

            setResult(calculatedResult);
            setHeadlessUltraResult(calculatedResult);
        }
    };

    return (
        <>
            <form onSubmit={(e) => e.preventDefault()}>
                <FormField
                    id="event-per-day"
                    label="Event per Day"
                    value={formData.eventPerDay}
                    onChange={(value) => updateField('eventPerDay', value)}
                />

                <Toggle
                    id="event-toggle-switch"
                    label="Use Microbatching (recommended for datawarehousing)"
                    checked={isMicrobatching}
                    onChange={handleToggleMicrobatching}
                />

                <FormField
                    id="coverage-hours-event"
                    label="Event Usage Hours per Day"
                    value={formData.coverageHours}
                    onChange={(value) => updateField('coverageHours', value)}
                />

                <FormField
                    id="event-response-time"
                    label="Event Response Time (seconds)"
                    value={formData.eventResponseTime}
                    onChange={(value) => updateField('eventResponseTime', value)}
                    visible={passwordUnlocked && isMicrobatching}
                />

                <FormField
                    id="event-size"
                    label="Message Size (Bytes)"
                    value={formData.eventSize}
                    onChange={(value) => updateField('eventSize', value)}
                    visible={passwordUnlocked && !isMicrobatching}
                />

                <FormField
                    id="peak-event"
                    label="Peak (%)"
                    value={formData.peak}
                    onChange={(value) => updateField('peak', value)}
                />

                <Button onClick={calculate}>Calculate</Button>
            </form>

            {result && <ResultDisplay results={result} type="headless" />}
        </>
    );
}
