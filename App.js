import React, {useEffect, useState} from 'react';
import {View, Button, Text, StyleSheet} from 'react-native';
import * as RNFS from 'react-native-fs';
import * as difficulties from './difficulties.js';

function useForceUpdate() {
  const [value, setValue] = useState(0); // integer state
  return () => setValue(val => value + 1); // update the state to force render
}

const App = props => {
  //-------------------Variables--------------------------
  const forceUpdate = useForceUpdate();
  var arr = new Array(9);
  var [board, setBoard] = useState([]);
  var [steps, setSteps] = useState(0);
  var tmpSolutions = [];
  var tmpFlag = false;

  //-------------------OnClickListeners-------------------
  var load = rawString => {
    rawString = rawString.replace(/\./g, '0');

    //Create empty 2d array 9x9
    for (var i = 0; i < 9; i++) {
      arr[i] = new Array(9);
    }

    var count = 0;
    //Fill array
    for (var i = 0; i < 9; i++) {
      for (var j = 0; j < 9; j++) {
        if (count < 81) {
          if (rawString.charAt(count) == 0) {
            arr[i][j] = '';
          } else {
            arr[i][j] = rawString.charAt(count);
          }
          count++;
        }
      }
    }
    console.log('Loaded ' + arr);
    updateUI();
  };

  var createSudokuPressed = () => {
    sync();
    tmpSteps = 0;
    load(difficulties.empty);
    createSudoku();
  };

  var countSolutionsPressed = () => {
    sync();
    solve(true);

    switch (tmpSolutions.length) {
      case 0:
        alert('No solution found!');
        break;
      case 1:
        alert('1 solution found!');
        break;
      case 51:
        alert('More than 50 solutions found!');
        break;
      default:
        alert(tmpSolutions.length + ' solutions found!');
        break;
    }
    updateUI();
  };

  var solvePressed = () => {
    sync();
    if (!solve(false)) {
      alert('No solution found!');
    } else {
      console.log(steps);
    }

    updateUI();
  };

  //-----------------------------Logic----------------------------

  var updateUI = () => {
    setBoard(current => arr);
    forceUpdate();
  };

  var sync = () => {
    arr = board;
    setSteps(current => 0);
    tmpSolutions = [];
    tmpFlag = false;
  };

  var validGuess = (rowIndex, columnIndex, digit) => {
    //checkRow
    for (var i = 0; i < 9; i++) {
      if (arr[rowIndex][i] == digit) {
        return false;
      }
    }

    //checkColumn
    for (var i = 0; i < 9; i++) {
      if (arr[i][columnIndex] == digit) {
        return false;
      }
    }

    //checkSquare
    var startRow = rowIndex - (rowIndex % 3);
    var startColumn = columnIndex - (columnIndex % 3);

    for (var i = startRow; i < startRow + 3; i++) {
      for (var j = startColumn; j < startColumn + 3; j++) {
        if (arr[i][j] == digit) {
          return false;
        }
      }
    }

    return true;
  };

  var solve = isSolutionCheck => {
    //If full, end nested loop
    for (var i = 0; i < 9; i++) {
      for (var j = 0; j < 9; j++) {
        if (arr[i][j] == '') {
          //Digits 1-9
          for (var k = 1; k < 10; k++) {
            if (validGuess(i, j, k)) {
              arr[i][j] = k;

              setSteps(current => current + 1);

              //recursion start
              if (solve(isSolutionCheck)) {
                return true;
              } else {
                arr[i][j] = '';
              }
            }
          }
          //Wrong
          return false;
        }
      }
    }

    //Check if array contains ''
    for (var x = 0; x < 9; x++) {
      for (var y = 0; y < 9; y++) {
        if (arr[x][y] == '') {
          console.log('No more solutions, raise flag!');
          tmpFlag = true;
        } else {
        }
      }
    }

    if (isSolutionCheck) {
      if (tmpFlag || tmpSolutions.length > 50) {
        console.log('Flag raised, quit loop!');
        return true;
      } else {
        tmpSolutions.push(arr);
      }
    } else {
      return true;
    }
  };

  var randomizeDigits = array => {
    for (var i = array.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));

      var temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
    return array;
  };

  var tmpSteps = 0;

  var fillSolutions = _callback => {
    _callback();
  };

  var createSudoku = () => {
    //If full, end nested loop
    for (var i = 0; i < 9; i++) {
      for (var j = 0; j < 9; j++) {
        if (arr[i][j] == '' || arr[i][j] == undefined) {
          //Digits Random

          for (var k = 1; k < 10; k++) {
            var randomDigits = randomizeDigits([1, 2, 3, 4, 5, 6, 7, 8, 9]);

            if (validGuess(i, j, randomDigits[k])) {
              arr[i][j] = randomDigits[k];
              setSteps(current => current + 1);
              tmpSteps++;

              if (tmpSteps == 100000) {
                console.log('Bad attempt, restart!');
                i = 0;
                j = 0;
                k = 1;
                load(difficulties.empty);
                tmpSteps = 0;
              }

              //recursion start
              if (createSudoku()) {
                return true;
              } else {
                arr[i][j] = '';
              }
            }
          }
          //Wrong
          return false;
        }
      }
    }

    console.log('Array was filled.');

    //Empty slots until solutions > 1

    var backupArray = arr;
    var holeCount = 0;

    //TODO Too many solutions atm!
    console.log('Before holes: ' + arr);

    while (holeCount < 30) {
      var success = clearRandomSpot(arr);

      if (success) {
        holeCount++;
      }

      var tmp = arr;
      fillSolutions(() => {
        tmpSolutions = [];
        tmpFlag = false;

        solve(true);
        arr = tmp;
      });

      if (tmpSolutions.length != 1) {
        arr = backupArray;
      } else {
        backupArray = arr;
      }
    }
    arr = backupArray;
    holeCount = 0;

    console.log('After holes: ' + arr);

    updateUI();

    return true;
  };

  var clearRandomSpot = tmpArr => {
    var randomSpot = Math.floor(Math.random() * 81) + 1;

    var counter = 1;

    for (var i = 0; i < 9; i++) {
      for (var j = 0; j < 9; j++) {
        if (counter == randomSpot) {
          if (tmpArr[i][j] == '') {
            return false;
          } else {
            tmpArr[i][j] = '';
            return true;
          }
        } else {
          counter++;
        }
      }
    }
  };
  //-------------------User Interface-------------------
  useEffect(() => {
    load(difficulties.empty);
  }, []);

  return (
    <View style={styles.mother}>
      <Text style={styles.top}>Sudoku{}</Text>

      <View style={styles.container}>
        {board.map((row, rIndex) => {
          return row.map((col, cIndex) => {
            return (
              <Text
                key={(rIndex + 1) * (cIndex + 1)}
                style={
                  (rIndex + 1) % 3 === 0 && (cIndex + 1) % 3 === 0
                    ? styles.numCorner
                    : (rIndex + 1) % 3 === 0
                    ? styles.numFloor
                    : (cIndex + 1) % 3 === 0
                    ? styles.numRightWall
                    : styles.num
                }>
                {board[rIndex][cIndex]}
              </Text>
            );
          });
        })}
      </View>

      <View style={styles.buttons}>
        <View style={styles.btn}>
          <Button
            title="Easy"
            onPress={load.bind(this, difficulties.easy)}></Button>
        </View>

        <View style={styles.btn}>
          <Button
            title="Medium"
            onPress={load.bind(this, difficulties.medium)}></Button>
        </View>
        <View style={styles.btn}>
          <Button
            title="Hard"
            onPress={load.bind(this, difficulties.hard)}></Button>
        </View>
        <View style={styles.btn}>
          <Button
            title="Samurai"
            onPress={load.bind(this, difficulties.samurai)}></Button>
        </View>
      </View>

      <View style={styles.buttons}>
        <View style={styles.btn}>
          <Button
            title="Empty"
            onPress={load.bind(this, difficulties.empty)}></Button>
        </View>

        <View style={styles.btn}>
          <Button
            title="Double"
            onPress={load.bind(this, difficulties.double)}></Button>
        </View>
        <View style={styles.btn}>
          <Button
            title="Unsolvable"
            onPress={load.bind(this, difficulties.unsolvable)}></Button>
        </View>
      </View>

      <View style={styles.btn}>
        <Button
          title="Create random sudoku (Beta)"
          onPress={createSudokuPressed}></Button>
      </View>

      <View style={styles.buttons}>
        <View style={styles.btn}>
          <Button
            title="Count solutions"
            onPress={countSolutionsPressed}></Button>
        </View>
        <View style={styles.btn}>
          <Button title="Solve" onPress={solvePressed}></Button>
        </View>
      </View>
      <Text>Steps: {steps}</Text>
    </View>
  );
};

export default App;
//-------------------StyleSheet-------------------
const styles = StyleSheet.create({
  top: {
    marginTop: 10,
    fontSize: 75,
  },
  mother: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'lightblue',
  },

  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    maxWidth: 30.1 * 9,

    marginBottom: 30,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    backgroundColor: 'black',
  },
  //28.2 BiS
  num: {
    width: 28.2,
    height: 28.2,
    borderWidth: 1,
    borderColor: 'black',
    backgroundColor: 'beige',
    fontSize: 20,
    textAlign: 'center',
  },
  numFloor: {
    width: 28.2,
    height: 32.2,
    borderWidth: 1,
    borderColor: 'black',
    backgroundColor: 'beige',
    fontSize: 20,
    textAlign: 'center',
    borderBottomWidth: 4,
  },
  numRightWall: {
    width: 32.2,
    height: 28.2,
    borderWidth: 1,
    borderColor: 'black',
    backgroundColor: 'beige',
    fontSize: 20,
    textAlign: 'center',
    borderRightWidth: 4,
  },
  numCorner: {
    width: 32.2,
    height: 32.2,
    borderWidth: 1,
    borderColor: 'black',
    backgroundColor: 'beige',
    fontSize: 20,
    textAlign: 'center',
    borderRightWidth: 4,
    borderBottomWidth: 4,
  },
  buttons: {
    flexDirection: 'row',
  },
  btn: {
    padding: 7,
  },
});
