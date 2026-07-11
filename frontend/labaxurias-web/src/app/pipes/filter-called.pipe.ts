import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterCalled',
  standalone: true
})
export class FilterCalledPipe implements PipeTransform {
  transform(items: any[]): number {
    if (!items) return 0;
    return items.filter(item => item.isCalled).length;
  }
}
