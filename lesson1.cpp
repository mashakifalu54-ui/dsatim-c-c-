#include <iostream>
#include <string>
using namespace std;

int main()
{
    string students[5] = {
        "Timothy",
        "James",
        "Mary",
        "John",
        "Peter"
    };

    string studentname;
    bool found = false;
    int position = -1;

    cout << "Enter student name: ";
    cin >> studentname;

    for (int i = 0; i < 5; i++)
    {
        if (students[i] == studentname)
        {
            found = true;
            position = i;
            break;
        }
    }

    if (found == true)
    {
        cout << "Student found at index: "
             << position << endl;
    }
    else
    {
        cout << "Student not found" << endl;
    }

    return 0;
}
      


      



