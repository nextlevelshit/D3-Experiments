<?php
/**
 * Created by PhpStorm.
 * User: nextlevelshit
 * Date: 14.06.15
 * Time: 03:50
 */

error_reporting(0);

$page = str_replace(" ", "%20", $_GET['page']);

$lang = ($_GET['lang']) ? $_GET['lang'] : substr($_SERVER['HTTP_ACCEPT_LANGUAGE'], 0, 2);

if (isset($category)) {

//  $url = "https://$lang.wikipedia.org/w/api.php?action=query&list=categorymembers&format=json&cmtitle=Category%3A$category&cmprop=ids%7Ctitle%7Ctype&cmnamespace=0%7C14&cmtype=subcat%7Cpage&cmlimit=12";
    $url = "https://$lang.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro=&explaintext=&titles=$page";

    $f = fopen($url, 'r');
    $html = '';

    while (!feof($f)) {
        $html .= fread($f, 240000);
    }

    // Decode to wikipedia output to readable array

    $json = json_decode($html, true);

    // Grep the necessary part of the wikipedia input

    $abstractWiki = $json['pages'][0];

    // Close file reading

    fclose($f);

    // Output as readable json

    echo(json_encode($abstractWiki));
}