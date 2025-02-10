#include <iostream>
#include <vector>
#include <string>
#include <unordered_map>
#include <fstream>
#include <sstream>
#include <emscripten.h>
using namespace std;

struct TrieNode {
    TrieNode* children[26];
    bool isEndOfWord;

    TrieNode() {
        for (int i = 0; i < 26; ++i) {
            children[i] = nullptr;
        }
        isEndOfWord = false;
    }
};

void backtrack(vector<vector<char>>& board, int row, int col, TrieNode* node, string& word, vector<vector<bool>>& visited, unordered_map<string, string>& result, vector<string>& path) {
    if (row < 0 || row >= board.size() || col < 0 || col >= board[0].size() || visited[row][col]) return;

    char ch = board[row][col];
    int index = ch - 'a';

    if (!node->children[index]) return;

    word.push_back(ch);
    path.push_back(to_string(row) + "," + to_string(col));
    visited[row][col] = true;
    node = node->children[index];

    if (node->isEndOfWord) {
        string pathString = "";
        for (const auto& p : path) {
            pathString += p + "-";
        }
        result[word] = pathString;
    }

    vector<pair<int, int>> directions = {{-1, 0}, {1, 0}, {0, -1}, {0, 1}, {-1, -1}, {-1, 1}, {1, -1}, {1, 1}};
    for (auto [dr, dc] : directions) {
        backtrack(board, row + dr, col + dc, node, word, visited, result, path);
    }

    word.pop_back();
    path.pop_back();
    visited[row][col] = false;
}

void insertWord(TrieNode* root, const string& word) {
    TrieNode* node = root;
    for (char ch : word) {
        int index = ch - 'a';
        if (!node->children[index]) {
            node->children[index] = new TrieNode();
        }
        node = node->children[index];
    }
    node->isEndOfWord = true;
}

extern "C" {
    EMSCRIPTEN_KEEPALIVE
    char* solve(const char* boardInput, const char* dictInput) {
        vector<vector<char>> board(4, vector<char>(4));
        int idx = 0;
        for (int i = 0; i < 4; ++i) {
            for (int j = 0; j < 4; ++j) {
                board[i][j] = boardInput[idx++];
                cout << board[i][j] << " ";
            }
        }

        vector<string> wordList;
        stringstream dictStream(dictInput);
        string singleword;
        while (dictStream >> singleword) {
            if (singleword.length() >= 3 && singleword.length() <= 8) {
                wordList.push_back(singleword);
            }
        }

        TrieNode* root = new TrieNode();
        for (const string& word : wordList) {
            insertWord(root, word);
        }

        unordered_map<string, string> result;
        string word;
        vector<string> path = {};
        int rows = board.size(), cols = board[0].size();
        vector<vector<bool>> visited(rows, vector<bool>(cols, false));

        for (int r = 0; r < rows; ++r) {
            for (int c = 0; c < cols; ++c) {
                backtrack(board, r, c, root, word, visited, result, path);
            }
        }

        static string output;
        output.clear();
        for (const auto& pair : result) {
            string word = pair.first;
            string path = pair.second;
            output += word + "|" + path + "\n";
        }

        return (char*)output.c_str();
    }
}