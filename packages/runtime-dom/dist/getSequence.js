function getSequence(arr) {
  const len = arr.length;
  const p = Array(len).fill(0); // 记录前驱的数组
  let start;
  let end;
  let middle;
  const result = [0];
  let resultLastIndex;
  for (let index = 0; index < len; index++) {
    const arrI = arr[index];
    if (arrI !== 0) {
      // 忽略 0 因为 0 表示新增节点
      resultLastIndex = result[result.length - 1];
      if (arr[resultLastIndex] < arrI) {
        // 比较最后一项的值，如果当前值比它大，则直接加入到结果集中
        // 这里拿的是索引
        result.push(index);
        p[index] = resultLastIndex;
        continue;
      }
      // 不满足上述条件则，利用 二分查找 去找比当前大的边界值
      start = 0;
      end = result.length - 1;
      while (start < end) {
        middle = (start + end) >> 1;
        if (arr[result[middle]] < arrI) {
          start = middle + 1;
        } else {
          end = middle;
        }
      }
      if (arr[result[end]] > arrI) {
        result[end] = index;
        p[index] = result[end - 1];
      }
    }
  }
  let i = result.length - 1;
  let last = result[i]; // 最后一项肯定是对的
  while (i >= 0) {
    result[i] = last;
    last = p[last];
    i--;
  }
  return result;
}

console.log(getSequence([3, 2, 8, 9, 5, 6, 7, 11, 15, 4]));

console.log(getSequence([5, 3, 4, 0]));
