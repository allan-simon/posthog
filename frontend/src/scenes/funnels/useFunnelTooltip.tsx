import { useValues } from 'kea'
import React, { useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import { funnelLogic } from './funnelLogic'
import { FilterType, FunnelStepWithConversionMetrics } from '~/types'
import { LemonRow } from 'lib/components/LemonRow'
import { Lettermark, LettermarkColor } from 'lib/components/Lettermark/Lettermark'
import { EntityFilterInfo } from 'lib/components/EntityFilterInfo'
import { getActionFilterFromFunnelStep } from 'scenes/insights/views/Funnels/funnelStepTableUtils'
import { humanFriendlyDuration, humanFriendlyNumber, percentage } from 'lib/utils'
import { ensureTooltipElement } from 'scenes/insights/views/LineGraph/LineGraph'
import { LemonDivider } from 'lib/components/LemonDivider'
import { cohortsModel } from '~/models/cohortsModel'
import { ClickToInspectActors } from 'scenes/insights/InsightTooltip/InsightTooltip'
import { groupsModel } from '~/models/groupsModel'
import { propertyDefinitionsModel } from '~/models/propertyDefinitionsModel'
import { formatBreakdownLabel } from 'scenes/insights/utils'

/** The tooltip is offset horizontally by a few pixels from the bar to give it some breathing room. */
const FUNNEL_TOOLTIP_OFFSET_PX = 2

interface FunnelTooltipProps {
    showPersonsModal: boolean
    stepIndex: number
    series: FunnelStepWithConversionMetrics
    groupTypeLabel: string
    filters: Partial<FilterType>
}

function FunnelTooltip({
    showPersonsModal,
    stepIndex,
    series,
    groupTypeLabel,
    filters,
}: FunnelTooltipProps): JSX.Element {
    const { cohorts } = useValues(cohortsModel)
    const { formatPropertyValueForDisplay } = useValues(propertyDefinitionsModel)
    return (
        <div className="FunnelTooltip InsightTooltip mx-2 mt-1 mb-2 p-2">
            <LemonRow icon={<Lettermark name={stepIndex + 1} color={LettermarkColor.Gray} />} fullWidth>
                <strong>
                    <EntityFilterInfo
                        filter={getActionFilterFromFunnelStep(series)}
                        style={{ display: 'inline-block' }}
                    />{' '}
                    •{' '}
                    {formatBreakdownLabel(
                        cohorts,
                        formatPropertyValueForDisplay,
                        series.breakdown_value,
                        series.breakdown,
                        filters.breakdown_type
                    )}
                </strong>
            </LemonRow>
            <LemonDivider className="my-2" />
            <table>
                <tbody>
                    <tr>
                        <td>{stepIndex === 0 ? 'Entered' : 'Converted'}</td>
                        <td>{humanFriendlyNumber(series.count)}</td>
                    </tr>
                    {stepIndex > 0 && (
                        <tr>
                            <td>Dropped off</td>
                            <td>{humanFriendlyNumber(series.droppedOffFromPrevious)}</td>
                        </tr>
                    )}
                    <tr>
                        <td>Conversion so far</td>
                        <td>{percentage(series.conversionRates.total, 2, true)}</td>
                    </tr>
                    {stepIndex > 0 && (
                        <tr>
                            <td>Conversion from previous</td>
                            <td>{percentage(series.conversionRates.fromPrevious, 2, true)}</td>
                        </tr>
                    )}
                    {stepIndex > 0 && series.median_conversion_time != null && (
                        <tr>
                            <td>Median time from previous</td>
                            <td>{humanFriendlyDuration(series.median_conversion_time, 3)}</td>
                        </tr>
                    )}
                    {stepIndex > 0 && series.average_conversion_time != null && (
                        <tr>
                            <td>Average time from previous</td>
                            <td>{humanFriendlyDuration(series.average_conversion_time, 3)}</td>
                        </tr>
                    )}
                </tbody>
            </table>
            {showPersonsModal && <ClickToInspectActors groupTypeLabel={groupTypeLabel} />}
        </div>
    )
}

export function useFunnelTooltip(showPersonsModal: boolean): React.RefObject<HTMLDivElement> {
    const { filters, isTooltipShown, currentTooltip, tooltipOrigin } = useValues(funnelLogic)
    const { aggregationLabel } = useValues(groupsModel)

    const vizRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const svgRect = vizRef.current?.getBoundingClientRect()
        const tooltipEl = ensureTooltipElement()
        tooltipEl.style.opacity = isTooltipShown ? '1' : '0'
        const tooltipRect = tooltipEl.getBoundingClientRect()
        if (tooltipOrigin) {
            ReactDOM.render(
                <>
                    {currentTooltip && (
                        <FunnelTooltip
                            showPersonsModal={showPersonsModal}
                            stepIndex={currentTooltip[0]}
                            series={currentTooltip[1]}
                            groupTypeLabel={aggregationLabel(filters.aggregation_group_type_index).plural}
                            filters={filters}
                        />
                    )}
                </>,
                tooltipEl
            )
            // Put the tooltip to the bottom right of the cursor, but flip to left if tooltip doesn't fit
            let xOffset: number
            if (
                svgRect &&
                tooltipRect &&
                tooltipOrigin[0] + tooltipOrigin[2] + tooltipRect.width + FUNNEL_TOOLTIP_OFFSET_PX >
                    svgRect.x + svgRect.width
            ) {
                xOffset = -tooltipRect.width - FUNNEL_TOOLTIP_OFFSET_PX
            } else {
                xOffset = tooltipOrigin[2] + FUNNEL_TOOLTIP_OFFSET_PX
            }
            tooltipEl.style.left = `${window.pageXOffset + tooltipOrigin[0] + xOffset}px`
            tooltipEl.style.top = `${window.pageYOffset + tooltipOrigin[1]}px`
        } else {
            tooltipEl.style.left = 'revert'
            tooltipEl.style.top = 'revert'
        }
    }, [isTooltipShown, tooltipOrigin, currentTooltip])

    return vizRef
}
