#include <iostream>
#include <string>
using namespace std;

int main()
{
    int employeeNumber[3];
    string name[3];
    double salary[3];
    double tax[3];
    double netPay[3];
    double totalSalary = 0;
double totalTax = 0;


    for (int i = 0; i < 3; i++)
{
    cout << "Enter employee number: ";
    cin >> employeeNumber[i];

    cout << "Enter employee name: ";
    cin >> name[i];

    cout << "Enter salary: ";
    cin >> salary[i];

    tax[i] = salary[i] * 0.05;
netPay[i] = salary[i] - tax[i];


}


if (netPay[0] < netPay[1])
{
    

    double tempNetPay = netPay[0];
    netPay[0] = netPay[1];
    netPay[1] = tempNetPay;

    // The other four employee fields must also be swapped here.

int tempEmployeeNumber = employeeNumber[0];
employeeNumber[0] = employeeNumber[1];
employeeNumber[1] = tempEmployeeNumber;

string tempName = name[0];
name[0] = name[1];
name[1] = tempName;

double tempSalary = salary[0]; 
salary[0] = salary[1]; 
salary[1] = tempSalary;

double tempTax = tax[0];
tax[0] = tax[1];
tax[1] = tempTax;
}
for(int i= 0;i<3;i++ )
{
    cout<<employeeNumber[i]<<" "<<name[i]<<" "<<salary[i]<<" "<<tax[i]<<" "<<netPay[i]<<endl;

totalSalary = totalSalary + salary[i];
totalTax = totalTax + tax[i];


}
    

cout << "Total salary: " << totalSalary << endl;
cout << "Total tax: " << totalTax << endl;






























































































































































    return 0;
}