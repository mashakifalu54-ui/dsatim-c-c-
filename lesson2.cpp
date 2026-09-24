#include <iostream>
#include <string>
using namespace std;

int main()
{

    string students[3]= {
    "Timothy",
    "Mary",
    "John"};


    string studentname;
    bool found = false;
    int position= -1;

       
       cout << "Enter student name";
       cin >> studentname;

       

       for (int i = 0; i < 3; i++)
       {
        if (students[i]== studentname)
        {
            found=true;
            position = i;
            break;

        }
       }
        if (found == true){
        cout<<"Student name found at index  : "<<position <<endl;

       }
       else
       {
        cout<< "student not found"<<endl;
       }
       

       

       return 0;

}