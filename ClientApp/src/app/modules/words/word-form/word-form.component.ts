import * as _ from 'underscore';
import { SaveWord } from '../../../common/models/SaveWord';
import { SaveSubcategory } from '../../../common/models/SaveSubcategory';
import { Word } from '../../../common/models/Word';

import { PartOfSpeechService } from '../shared/part-of-speech.service';
import { FeatureService } from '../shared/feature.service';
import { CategoryService } from '../shared/category.service';
import { WordService } from '../shared/word.service';
import { SubcategoryService } from './../shared/subcategory.service';

import { ToastyService, ToastyConfig } from "ng2-toasty";
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/forkJoin';

@Component({
  selector: 'app-word-form',
  templateUrl: './word-form.component.html',
  styleUrls: ['./word-form.component.css']
})
export class WordFormComponent implements OnInit {
  headerText: string;
  loading: boolean;
  categories: any[];
  subcategories: any[];
  features: any[];
  partsOfSpeech: any[];
  word: SaveWord = {
    id: 0,
    name: '',
    meaning: '',
    definition: '',
    example: '',
    link: '',
    isLearned: false,
    categoryId: 0,
    subcategoryId: 0,
    partOfSpeechId: 0,
    features: [],
    pronunciation: {
      Uk: '',
      Us: ''
    }
  };

  subcategory: SaveSubcategory = {
    id: 0,
    name: '',
    categoryId: 0,
  };

  collapsedFeatures: any[] = [];
  froalaOptions: Object;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private categoryService: CategoryService,
    private featureService: FeatureService,
    private partOfSpeechService: PartOfSpeechService,
    private toastyService: ToastyService,
    private toastyConfig: ToastyConfig,
    private wordService: WordService,
    private subcategoryService: SubcategoryService
  ) {
    route.params.subscribe(p => {
      this.word.id = +p['id'] || 0;
    });

    this.toastyConfig.theme = 'bootstrap';
  }

  ngOnInit() {
    this.word = this.route.snapshot.data['word'];

    this.headerText = this.word.id ? "Edit the Word" : "Add a Word"

    this.froalaOptions = {
      placeholderText: "Give an example of using the word in a sentence",
    }

    var sources = [
      this.categoryService.getCategories(),
      this.featureService.getFeatures(),
      this.partOfSpeechService.getPartsOfSpeech()
    ];

    Observable.forkJoin(sources).subscribe(data => {
      this.categories = data[0];
      this.features = data[1];
      this.partsOfSpeech = data[2];
      this.populateSubcategories();
    },
      err => {
        if (err.status == 404) {
          this.router.navigate(['']);
        }
      });
  }

  onCategoryChange() {
    this.populateSubcategories();
    delete this.word.subcategoryId;
  }

  private populateSubcategories() {
    let selectedCategory = this.categories.find(c => c.id == this.word.categoryId);
    this.subcategories = selectedCategory ? selectedCategory.subcategories : [];
  }

  onFeatureToggle(featureId, $event) {
    if ($event.target.checked) {
      this.word.features.push(featureId);
    }
    else {
      var index = this.word.features.indexOf(featureId);
      this.word.features.splice(index, 1);
    }
  }

  onCollapse(featureId) {
    var index = this.collapsedFeatures.indexOf(featureId);
    index > -1 ? this.collapsedFeatures.splice(index, 1) : this.collapsedFeatures.push(featureId);
  }

  submit() {
    var message = (this.word.id) ? 'The word has been sucessfully updated' : 'The word has been sucessfully added';
    var result$ = (this.word.id) ? this.wordService.update(this.word) : this.wordService.create(this.word);

    result$.subscribe(word => {
      this.toastyService.success({
        title: 'Success',
        msg: message,
        showClose: true,
        timeout: 3000
      });
      this.router.navigate(['/words/', word.id])
    });
  }
  
  private addSubcategoryToCategory(subcategory) {
    let selectedCategory = this.categories.find(c => c.id == subcategory.categoryId);
    var temp = { id: subcategory.id, name: subcategory.name };
    selectedCategory.subcategories.push(temp);
  }

  addTagPromise = (name) => {
    return new Promise((resolve) => {
      this.loading = true;
      setTimeout(() => {
        this.subcategory.name = name;
        this.subcategory.categoryId = this.word.categoryId;

        var result$ = this.subcategoryService.create(this.subcategory);
        result$.subscribe(result => {
          this.toastyService.success({
            title: 'Success',
            msg: "The subcategory has been added",
            showClose: true,
            timeout: 3000
          });
          this.addSubcategoryToCategory(result);
          this.word.subcategoryId = result.id;
          resolve({ id: result.id, name: result.name, valid: true });
          this.loading = false;
        });
      }, 1000);
    })
  }
}