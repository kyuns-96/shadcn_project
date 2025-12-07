import { Input } from '@/components/ui/input'
import { useAppDispatch, useAppSelector, setDoeName } from '@/store'

const InputDemo = () => {
  const dispatch = useAppDispatch()
  const doeName = useAppSelector(state => state.sidebar.doeName)

  return (
    <Input
      type='text'
      placeholder='DoE Name'
      className='max-w-xs'
      value={doeName}
      onChange={(e) => dispatch(setDoeName(e.target.value))}
    />
  )
}

export default InputDemo
