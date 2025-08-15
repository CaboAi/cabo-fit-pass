"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface Calendar24Props {
  date?: Date
  time?: string
  onDateChange?: (date: Date | undefined) => void
  onTimeChange?: (time: string) => void
  error?: string
}

export function Calendar24({ 
  date, 
  time = "10:30", 
  onDateChange, 
  onTimeChange,
  error 
}: Calendar24Props) {
  const [open, setOpen] = React.useState(false)

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-3">
          <Label htmlFor="date-picker" className="px-1 text-purple-300">
            Date *
          </Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                id="date-picker"
                className="w-44 justify-between font-normal bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                {date ? date.toLocaleDateString() : "Select date"}
                <ChevronDownIcon />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto overflow-hidden p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                captionLayout="dropdown"
                onSelect={(selectedDate) => {
                  onDateChange?.(selectedDate)
                  setOpen(false)
                }}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex flex-col gap-3">
          <Label htmlFor="time-picker" className="px-1 text-purple-300">
            Time *
          </Label>
          <Input
            type="time"
            id="time-picker"
            step="1"
            value={time}
            onChange={(e) => onTimeChange?.(e.target.value)}
            className="w-32 bg-white/10 border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-400 appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
          />
        </div>
      </div>
      {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
    </div>
  )
}
