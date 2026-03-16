import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';
import Content from './dropdown-menu-content.svelte';
import Group from './dropdown-menu-group.svelte';
import Item from './dropdown-menu-item.svelte';
import Label from './dropdown-menu-label.svelte';
import Separator from './dropdown-menu-separator.svelte';
import Trigger from './dropdown-menu-trigger.svelte';

const Sub = DropdownMenuPrimitive.Sub;
const Root = DropdownMenuPrimitive.Root;
const RadioGroup = DropdownMenuPrimitive.RadioGroup;

export {
  Content,
  Root as DropdownMenu,
  Content as DropdownMenuContent,
  Group as DropdownMenuGroup,
  Item as DropdownMenuItem,
  Label as DropdownMenuLabel,
  RadioGroup as DropdownMenuRadioGroup,
  Separator as DropdownMenuSeparator,
  Sub as DropdownMenuSub,
  Trigger as DropdownMenuTrigger,
  Group,
  Item,
  Label,
  RadioGroup,
  Root,
  Separator,
  Sub,
  Trigger
};
