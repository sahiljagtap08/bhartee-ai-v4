export type LanguageKey = 'python' | 'cpp' | 'java' | 'javascript' | 'c';

export const LANGUAGE_TEMPLATES: Record<LanguageKey, string> = {
  python: `def solution():
    # Write your solution here
    pass

def test_solution():
    # Write your test cases here
    pass

if __name__ == "__main__":
    test_solution()`,
  
  cpp: `#include <iostream>
#include <vector>
using namespace std;

class Solution {
public:
    // Write your solution here
};

int main() {
    Solution solution;
    // Write your test cases here
    return 0;
}`,
  
  java: `public class Solution {
    // Write your solution here
    
    public static void main(String[] args) {
        Solution solution = new Solution();
        // Write your test cases here
    }
}`,
  
  javascript: `class Solution {
    // Write your solution here
}

function runTests() {
    const solution = new Solution();
    // Write your test cases here
}

runTests();`,
  
  c: `#include <stdio.h>
#include <stdlib.h>

// Write your solution here

int main() {
    // Write your test cases here
    return 0;
}`
};