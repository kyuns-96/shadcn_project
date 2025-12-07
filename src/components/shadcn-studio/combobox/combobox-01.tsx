'use client'

import { useState } from 'react'

import { CheckIcon, ChevronsUpDownIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

import { cn } from '@/lib/utils'
import { useAppDispatch, useAppSelector, setProject, setBlock, setNetVer, setRevision, setEcoNum } from '@/store'

const frameworks = [
  {
    value: 'next.js',
    label: 'Next.js'
  },
  {
    value: 'sveltekit',
    label: 'SvelteKit'
  },
  {
    value: 'nuxt.js',
    label: 'Nuxt.js'
  },
  {
    value: 'remix',
    label: 'Remix'
  },
  {
    value: 'astro',
    label: 'Astro'
  }
]

interface ComboboxDemoProps {
  name: 'PROJECT' | 'BLOCK' | 'NET_VER' | 'REVISION' | 'ECO_NUM'
}

const ComboboxDemo = ({ name }: ComboboxDemoProps) => {
  const [open, setOpen] = useState(false)
  const dispatch = useAppDispatch()

  const value = useAppSelector((state) => {
    switch (name) {
      case 'PROJECT': return state.sidebar.project
      case 'BLOCK': return state.sidebar.block
      case 'NET_VER': return state.sidebar.netVer
      case 'REVISION': return state.sidebar.revision
      case 'ECO_NUM': return state.sidebar.ecoNum
      default: return ''
    }
  })

  const setValue = (newValue: string) => {
    switch (name) {
      case 'PROJECT': dispatch(setProject(newValue)); break;
      case 'BLOCK': dispatch(setBlock(newValue)); break;
      case 'NET_VER': dispatch(setNetVer(newValue)); break;
      case 'REVISION': dispatch(setRevision(newValue)); break;
      case 'ECO_NUM': dispatch(setEcoNum(newValue)); break;
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className='w-[200px] justify-between'
          aria-label={`${name} combobox`}
        >
          {value ? frameworks.find(framework => framework.value === value)?.label : `Select ${name}...`}
          <ChevronsUpDownIcon className='opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='p-0 w-[200px]'>
        <Command>
          <CommandInput placeholder={`Search ${name}...`} className='h-9' />
          <CommandList>
            <CommandEmpty>No {name} found.</CommandEmpty>
            <CommandGroup>
              {frameworks.map(framework => (
                <CommandItem
                  key={framework.value}
                  value={framework.value}
                  onSelect={currentValue => {
                    setValue(currentValue === value ? '' : currentValue)
                    setOpen(false)
                  }}
                >
                  {framework.label}
                  <CheckIcon className={cn('ml-auto', value === framework.value ? 'opacity-100' : 'opacity-0')} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export default ComboboxDemo
