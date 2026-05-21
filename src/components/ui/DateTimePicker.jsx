/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react'
import { Clock, ArrowLeft } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

export function DateTimePicker({ date, time, onDateChange, onTimeChange, disabled }) {
  const [isOpen, setIsOpen] = useState(false)
  const parsedDate = date ? parseISO(date) : undefined
  const [tempTime, setTempTime] = useState(time || '12:00')
  const [isTimeView, setIsTimeView] = useState(false)

  useEffect(() => {
    if (time) setTempTime(time)
  }, [time])

  const handleDateSelect = (selectedDate) => {
    if (selectedDate) {
      onDateChange(format(selectedDate, 'yyyy-MM-dd'))
    } else {
      onDateChange('')
    }
  }

  const handleTimeSelect = (type, val) => {
    const [h, m] = tempTime.split(':')
    let newTime = tempTime
    if (type === 'hour') newTime = `${val}:${m}`
    if (type === 'minute') newTime = `${h}:${val}`
    
    setTempTime(newTime)
    onTimeChange(newTime)
  }

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'))
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'))
  const [selectedHour, selectedMinute] = tempTime.split(':')

  return (
    <Popover open={isOpen && !disabled} onOpenChange={(open) => {
      if (!disabled) setIsOpen(open)
    }}>
      <PopoverTrigger asChild>
        <button
          disabled={disabled}
          type="button"
          className="flex-1 bg-transparent border-0 text-left outline-none text-[var(--foreground)] font-inherit flex items-center min-h-[36px] w-full"
          style={{ cursor: 'inherit', padding: 0 }}
        >
          {date ? (
            <span>
              {format(parseISO(date), 'MM/dd/yyyy')} &bull; {time}
            </span>
          ) : (
            <span style={{ color: 'var(--muted-foreground)' }}>Set date & time</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 flex flex-col" align="start">
        {!isTimeView ? (
          <>
            <Calendar
              mode="single"
              selected={parsedDate}
              onSelect={handleDateSelect}
              initialFocus
            />
            <div className="p-3 border-t flex items-center justify-between">
              <div className="flex items-center gap-2" style={{ color: 'var(--muted-foreground)' }}>
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">Time</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsTimeView(true)}
                className="font-mono"
              >
                {tempTime}
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-col w-[276px]">
            <div className="flex items-center justify-between p-3 border-b">
              <Button variant="ghost" size="sm" onClick={() => setIsTimeView(false)} className="h-8 px-2 text-muted-foreground">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <span className="text-sm font-medium">Set Time</span>
              <div className="w-16"></div>
            </div>
            <div className="flex justify-center p-4 gap-4 h-[240px]">
              <div className="flex flex-col gap-1 overflow-y-auto w-16 snap-y scroll-smooth" style={{ scrollbarWidth: 'none' }}>
                {hours.map(h => (
                  <Button 
                    key={h} 
                    variant={selectedHour === h ? "default" : "ghost"} 
                    className="snap-center shrink-0"
                    onClick={() => handleTimeSelect('hour', h)}
                  >
                    {h}
                  </Button>
                ))}
              </div>
              <div className="text-2xl font-bold flex items-center justify-center opacity-50 pb-2">:</div>
              <div className="flex flex-col gap-1 overflow-y-auto w-16 snap-y scroll-smooth" style={{ scrollbarWidth: 'none' }}>
                {minutes.map(m => (
                  <Button 
                    key={m} 
                    variant={selectedMinute === m ? "default" : "ghost"} 
                    className="snap-center shrink-0"
                    onClick={() => handleTimeSelect('minute', m)}
                  >
                    {m}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
