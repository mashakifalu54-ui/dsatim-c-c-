#include <iostream>
#include <string>
using namespace std;

int main()
{
    double salary1=2000;
    double salary2=4000;
    double temp;

    


cout << "Before swapping:" << endl;

// print salary1
cout<<salary1<<endl;
// print salary2
cout<<salary2<<endl;

// three swap statements here
temp=salary1;
    salary1 = salary2;
     salary2= temp;


// print salary1
cout<<salary1<<endl;
// print salary2cout<<salary2<<endl;
cout<<salary2<<endl;


return 0;
}